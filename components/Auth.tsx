import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GREPTILE_API_KEY } from '@env';
import { RootStackParamList } from '../navigationTypes';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

// GitHub OAuth endpoints
const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
};

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'com.msh',
});

type AuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AuthScreen'>;

export default function Auth() {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<any[]>([]);
  const [isIndexing, setIsIndexing] = useState(false); // New state to track indexing status

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GITHUB_CLIENT_ID,
      scopes: ['user', 'read:org', 'user:email', 'repo', 'gist'],
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('Authorization Code received:', code);
      fetchAccessToken(code);
    } else if (response) {
      console.log('OAuth Response:', response);
    }
  }, [response]);

  const fetchAccessToken = async (code: string) => {
    console.log('Fetching access token...');
    try {
      const url = discovery.tokenEndpoint;
      const params = {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      };
      console.log('Token request payload:', params);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      console.log('Token response data:', data);

      if (data.error) {
        Alert.alert('Error', data.error_description || 'An error occurred while fetching access token.');
        return;
      }

      setAccessToken(data.access_token);
      console.log('Access Token set:', data.access_token);
      fetchGitHubUser(data.access_token);
    } catch (error) {
      console.error('Error fetching access token:', error);
    }
  };

  const fetchGitHubUser = async (token: string) => {
    console.log('Fetching GitHub user info...');
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
        },
      });

      const data = await response.json();
      console.log('GitHub user data:', data);
      setUserInfo(data);
      fetchRepositories(token);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchRepositories = async (token: string) => {
    console.log('Fetching GitHub repositories...');
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        headers: {
          Authorization: `token ${token}`,
        },
      });

      const repos = await response.json();
      setRepositories(repos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  const toggleRepositorySelection = (repo: any) => {
    const isSelected = selectedRepos.some((r) => r.id === repo.id);
    if (isSelected) {
      setSelectedRepos(selectedRepos.filter((r) => r.id !== repo.id));
    } else {
      setSelectedRepos([...selectedRepos, repo]);
    }
  };

  const confirmSelection = async () => {
    if (selectedRepos.length === 0) {
      Alert.alert('No Repositories Selected', 'Please select at least one repository to index.');
      return;
    }

    setIsIndexing(true); // Set indexing status to true

    for (const repo of selectedRepos) {
      await indexRepository(repo.name, repo.owner.login);
    }

    console.log('Repositories Indexed successfully.');
    

    setTimeout(() => {
      navigation.navigate('ChatScreen', { repositories: selectedRepos, githubToken: accessToken });
      setIsIndexing(false); // Set indexing status to false
    }, 2000); // Add a slight delay before navigating
  };

  const indexRepository = async (repoName: string, owner: string) => {
    if (!accessToken) {
      console.error('GitHub token not found');
      return;
    }

    const repositoryPayload = {
      remote: 'github',
      repository: `${owner}/${repoName}`,
      branch: 'main',
      reload: true,
      notify: true,
    };

    console.log('Indexing Repository:', repositoryPayload);

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GREPTILE_API_KEY}`,
        'X-Github-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(repositoryPayload),
    };

    try {
      const response = await fetch('https://api.greptile.com/v2/repositories', options);
      const data = await response.json();
      console.log('Repository Indexing Response:', data);
    } catch (error) {
      console.error('Error indexing repository:', error);
      Alert.alert('Error', 'Failed to index repository.');
    }
  };

  const handleSignOut = () => {
    console.log('Signing out...');
    setAccessToken(null);
    setUserInfo(null);
    setRepositories([]);
    setSelectedRepos([]);
    Alert.alert('Signed out', 'You have been signed out successfully.');
  };

  const renderRepositoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.repoItem}
      onPress={() => toggleRepositorySelection(item)}
    >
      <View style={[styles.checkbox, selectedRepos.some((repo) => repo.id === item.id) && styles.checkedCheckbox]}>
        {selectedRepos.some((repo) => repo.id === item.id) && (
          <View style={styles.checkboxTick} />
        )}
      </View>
      <View style={styles.repoTextContainer}>
        <Text style={styles.repoName}>{item.name}</Text>
        <Text style={styles.repoDescription}>{item.description || "No description provided"}</Text>
      </View>
    </TouchableOpacity>
  );
  
  



  return (
    <SafeAreaView style={styles.container}>
      {!accessToken ? (
        <View style={styles.centeredContainer}> 
          <Text style={styles.welcomeMessage}>Welcome to Greptile Mobile!</Text>
          <TouchableOpacity style={styles.signInButton} onPress={() => promptAsync()}>
            <Image source={require('../assets/github.png')} style={styles.githubIcon} />
            <Text style={styles.signInButtonText}>Sign in with GitHub</Text>
          </TouchableOpacity>
        </View>
      ) : isIndexing ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.indexingMessage}>Indexing Repositories, Please Wait...</Text>
        </View>
      ) : (
        <View>
          <View style={styles.header}>
            <Text style={styles.heading}>Welcome, {userInfo?.login}!</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subHeading}>Select repositories to index:</Text>
          <FlatList
            data={repositories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderRepositoryItem}
            style={styles.flatList}
          />
          <TouchableOpacity style={styles.confirmButton} onPress={confirmSelection}>
            <Text style={styles.confirmButtonText}>Confirm Selection</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#dcedc8', // Pastel green background color
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexingMessage: {
    fontSize: 18,
    color: '#1b5e20',
    textAlign: 'center',
    fontWeight: '600',
  },
  welcomeMessage: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1b5e20',
    marginBottom: 30,
    textAlign: 'center',
  },
  signInButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    elevation: 50,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  githubIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1b5e20',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    color: '#1b5e20',
    fontWeight: '600',
  },
  subHeading: {
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '500',
    color: '#1b5e20',
    textAlign: 'center',
  },
  repoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#a5d6a7', // Lighter pastel green for repo items
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1b5e20',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#388e3c',
  },
  checkboxTick: {
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  repoTextContainer: {
    flexShrink: 1,
  },
  repoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0e3311',
  },
  repoDescription: {
    fontSize: 14,
    color: '#1f5223',
  },
  signOutButton: {
    padding: 10,
    backgroundColor: '#c62828',
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#388e3c',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  flatList: {
    height: 400,
    backgroundColor: '#dcedc8', // Match the background with the overall theme
    flexGrow: 0,
  },
});

