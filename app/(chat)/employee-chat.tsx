import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import useAsyncStorage from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { io } from "socket.io-client";
import AntDesign from "@expo/vector-icons/AntDesign";
import Greeting from "@/components/Greeting";
import BaseUrl from "@/utils/config/baseUrl";
import Loader from "@/components/Loader";
import ToastManager, { Toast } from "toastify-react-native";

const EmployeeChat = () => {
  const { employeeId }: any = useLocalSearchParams();
  const [accessToken, isLoading]: any = useAsyncStorage("@access_token");
  const [user]: any = useAsyncStorage("@user");

  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  const socket: any = useRef(null);

  useEffect(() => {
    if (user?._id) {
      socket.current = io(`${process.env.EXPO_PUBLIC_BASEURL}/` || "", {
        query: { userId: user._id },
      });

      socket.current.on("connect", () => {
        console.log("Connected to user 💬", socket.current.id);
      });

      socket.current.on("disconnect", () => {
        console.log("Disconnected from user 💬 ");
      });

      socket.current.on(
        "receiveMessage",
        ({ senderId, receiverId, message }: any) => {
          if (message && message.text) {
            if (senderId === user._id) {
              setSentMessages((prevMessages) => [
                ...prevMessages,
                { senderId, receiverId, ...message },
              ]);
            } else if (receiverId === user._id) {
              setReceivedMessages((prevMessages) => [
                ...prevMessages,
                { senderId, receiverId, ...message },
              ]);
            }
          }
        }
      );

      return () => {
        socket.current.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!employeeId || !accessToken || isLoading || !user)
        return (
          <Loader
            isLoading={!employeeId || !accessToken || isLoading || !user}
          />
        );
      try {
        const userId = user._id;
        const coworkerId = JSON.parse(employeeId);
        const response = await BaseUrl.get(`api/v1/coworker-chats/messages`, {
          params: {
            userId: userId,
            coworkerId: coworkerId,
          },
        });
        const data = response.data;
        if (data && data.coworkerChats && data.coworkerChats.length > 0) {
          const chat = data.coworkerChats[0];
          setReceivedMessages(chat.messageReceived || []);
          setSentMessages(chat.messageSent || []);
        } else {
          setReceivedMessages([]);
          setSentMessages([]);
        }
      } catch (error: any) {
        if (
          error.response?.status === 404 &&
          error.response?.data?.message === "No chat found for this user"
        ) {
          setError("No chat found for this user.");
        } else {
          setError(
            error.message || "An error occurred while fetching messages."
          );
        }
        console.log("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [employeeId, accessToken, isLoading, user]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [receivedMessages, sentMessages]);

  const sendMessage = () => {
    const senderId = user?._id;
    if (!newMessage.trim()) return Toast.error("Message is empty", "top");

    if (!senderId) return Toast.error("UserID not avaiable", "top");

    socket.current.emit("sendMessage", {
      senderId,
      receiverId: JSON.parse(employeeId),
      messageText: newMessage.trim(),
    });

    setNewMessage("");
  };

  if (loading || isLoading || error)
    return <Loader isLoading={loading || isLoading} />;

  // Combine and sort messages for display, filtering out duplicates by timestamp
  const combinedMessages = [
    ...receivedMessages.map((msg) => ({ ...msg, type: "received" })),
    ...sentMessages.map((msg) => ({ ...msg, type: "sent" })),
  ]
    .filter(
      (message, index, self) =>
        index ===
        self.findIndex(
          (m) => m.timestamp === message.timestamp && m.text === message.text
        )
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ToastManager />
      <SafeAreaView style={styles.container}>
        <View className="flex-row justify-between items-center  p-5">
          <TouchableOpacity>
            <AntDesign
              onPress={() => router.push("/home")}
              name="arrowleft"
              size={24}
              color="black"
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>Chat</Text>
          <Greeting />
        </View>
        <ScrollView
          style={styles.chatContainer}
          ref={scrollViewRef}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {combinedMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text>No messages to display</Text>
            </View>
          ) : (
            combinedMessages &&
            combinedMessages.map((message: any, id: any) => (
              <View
                key={id}
                style={[
                  styles.messageContainer,
                  message.type === "received"
                    ? styles.receivedMessage
                    : styles.sentMessage,
                ]}
              >
                <Text>{message.text}</Text>
                <Text style={styles.timestamp}>
                  {new Date(message.timestamp).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default EmployeeChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerText: {
    textAlign: "center",
    fontSize: 24,
    marginVertical: 10,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    maxWidth: "75%",
  },
  sentMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ECECEC",
  },
  timestamp: {
    fontSize: 10,
    color: "#888",
    marginTop: 5,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  textInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 25,
    padding: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
