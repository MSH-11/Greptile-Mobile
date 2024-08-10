import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import { GREPTILE_API_KEY } from '@env';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const { repositories, githubToken } = route.params; // Retrieve the GitHub token

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // You can load initial chat history if needed
  }, []);

  const onSend = async (newMessages: IMessage[] = []) => {
    setMessages(GiftedChat.append(messages, newMessages));
    const userMessage = newMessages[0].text;

    // Call the Greptile API with the user's message
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
        'X-GitHub-Token': githubToken ?? '', // Ensure this is a string
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return response.json();
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: 1,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
