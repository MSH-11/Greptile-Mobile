import React, { useEffect, useState } from 'react';
import { Button, View, Text, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import CheckBox from '@react-native-community/checkbox'; // Updated import
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GREPTILE_API_KEY } from '@env';
import { RootStackParamList } from '../navigationTypes';

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
  const [selectedRepos, setSelectedRepos] = useState<any[]>([]); // State to hold selected repos

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

    Alert.alert('Indexing Repositories', 'Please wait while your selected repositories are being indexed.');

    for (const repo of selectedRepos) {
      await indexRepository(repo.name, repo.owner.login);
    }

    Alert.alert('Repositories Indexed', 'Your selected repositories have been indexed successfully.');
    navigation.navigate('ChatScreen', { repositories: selectedRepos, githubToken: accessToken });
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
      <CheckBox
        value={selectedRepos.some((repo) => repo.id === item.id)}
        onValueChange={() => toggleRepositorySelection(item)}
        style={styles.checkbox} // Added style for checkbox
      />
      <View style={styles.repoTextContainer}>
        <Text style={styles.repoName}>{item.name}</Text>
        <Text style={styles.repoDescription}>{item.description || "No description provided"}</Text>
      </View>
    </TouchableOpacity>
  );
  

  return (
    <View style={styles.container}>
      {!accessToken ? (
        <Button
          disabled={!request}
          title="Sign in with GitHub"
          onPress={() => {
            console.log('Initiating GitHub OAuth flow...');
            promptAsync();
          }}
        />
      ) : (
        <View>
          <View style={styles.header}>
            <Text style={styles.heading}>Welcome, {userInfo?.login}!</Text>
            <View style={styles.signOutButtonContainer}>
              <Button title="Sign Out" onPress={handleSignOut} />
            </View>
          </View>
          <Text style={styles.subHeading}>Select repositories to index:</Text>
          <FlatList
            data={repositories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderRepositoryItem}
            style={styles.flatList}
          />
          <View style={styles.confirmButtonContainer}>
            <Button
              title="Confirm Selection"
              onPress={confirmSelection}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
  },
  subHeading: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  repoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  checkbox: {
    marginRight: 10, // Adjusted spacing for the checkbox
  },
  repoTextContainer: {
    flexShrink: 1, // Ensures text does not overflow
  },
  repoName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  repoDescription: {
    fontSize: 14,
    color: '#555',
  },
  signOutButtonContainer: {
    marginLeft: 10,
  },
  confirmButtonContainer: {
    marginTop: 20,
  },
  flatList: {
    height: 400,
    backgroundColor: 'red',
    flexGrow: 0
  }
});

