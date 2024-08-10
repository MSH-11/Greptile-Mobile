import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { GiftedChat, Bubble, IMessage, InputToolbar, Send } from 'react-native-gifted-chat';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import { GREPTILE_API_KEY } from '@env';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { repositories, githubToken } = route.params;

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load initial chat history if needed
  }, []);

  const onSend = async (newMessages: IMessage[] = []) => {
    setMessages(GiftedChat.append(messages, newMessages));
    const userMessage = newMessages[0].text;

    setLoading(true);
    try {
      const response = await queryRepositories(userMessage);
      const botMessage = response.message;
      const botResponse = [{
        _id: Math.random().toString(),
        text: botMessage,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Greptile Bot',
          avatar: 'https://placeimg.com/140/140/tech',
        },
      }];
      setMessages((previousMessages) => GiftedChat.append(previousMessages, botResponse));
    } catch (error) {
      console.error('Error querying Greptile:', error);
      Alert.alert('Error', 'An error occurred while querying the repository.');
    } finally {
      setLoading(false);
    }
  };

  const queryRepositories = async (query: string) => {
    const requestBody = {
      messages: [{ content: query, role: 'user' }],
      repositories: repositories.map((repo) => ({
        remote: 'github',
        branch: 'main',
        repository: `${repo.owner.login}/${repo.name}`,
      })),
      stream: false,
    };

    const response = await fetch('https://api.greptile.com/v2/query', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GREPTILE_API_KEY}`,
        'X-GitHub-Token': githubToken ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return response.json();
  };

  const renderMessageText = (props: any) => {
    const { currentMessage } = props;
    const isCurrentUser = props.position === 'right';
    return (
      <Markdown
        style={{
          body: {
            fontSize: 15,
            color: isCurrentUser ? '#fff' : '#000',
          },
          code: {
            fontFamily: 'monospace',
            backgroundColor: isCurrentUser ? '#388e3c' : '#e0e0e0',
            color: isCurrentUser ? '#fff' : '#000',
            padding: 4,
            borderRadius: 4,
          },
        }}
      >
        {currentMessage.text}
      </Markdown>
    );
  };

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: '#b4d1c1', // Light cyan color for the left bubble
            paddingHorizontal: 15,
            paddingTop: 10,
            borderRadius: 10,
          },
          right: {
            backgroundColor: '#388e3c', // Darker green for the right bubble
            paddingHorizontal: 15,
            paddingTop: 10,
            borderRadius: 10,
          },
        }}
        renderMessageText={renderMessageText}
      />
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#dcdcdc',
          borderRadius: 20,
          marginHorizontal: 10,
          marginBottom: 10,
          elevation: 5,
          paddingHorizontal: 10,
          paddingTop: 5,
        }}
        primaryStyle={{ alignItems: 'center' }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send {...props}>
        <View style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#388e3c" />
        </View>
      </Send>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#033801" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Chat with Repos    </Text>
      </View>
      {loading && <ActivityIndicator size="large" color="#388e3c" />}
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: 1,
        }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        textInputProps={{
          editable: !loading, // Disable text input while loading
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dcedc8', // Pastel green background color
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#dcedc8',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#033801',
    textAlign: 'center',
    flex: 1,
  },
  sendButton: {
    marginBottom: 10,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
