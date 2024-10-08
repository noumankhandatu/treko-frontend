import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SectionList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BaseUrl from "@/utils/config/baseUrl";
import AntDesign from "@expo/vector-icons/AntDesign";
import useAsyncStorage from "@/hooks/useAuth";
import { primary } from "@/constants/colors";

const BossTraceChats = () => {
  const [user]: any = useAsyncStorage("@user");

  const [employees, setEmployees] = useState<any>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedPair, setSelectedPair] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [emptyStateMessage, setEmptyStateMessage] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const { data } = await BaseUrl.get("/api/v1/get-all-employees");
        setEmployees(data?.employees || []);
      } catch (error) {
        console.log("Error fetching employees:", error);
        setEmptyStateMessage("Error fetching employees.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!selectedPair) return;

      setLoadingChats(true);
      setEmptyStateMessage("");

      try {
        const { data, status } = await BaseUrl.get(
          `/api/v1/trace-employees-chats`,
          {
            params: {
              employeeId1: selectedPair[0]._id,
              employeeId2: selectedPair[1]._id,
            },
          }
        );

        if (status === 200) {
          const employee1Id = selectedPair[0]._id;
          const employee2Id = selectedPair[1]._id;

          // Extract messageReceived arrays for both employees
          const employee1Received =
            data.find((chat: any) => chat.userId === employee1Id)
              ?.messageReceived || [];
          const employee2Received =
            data.find((chat: any) => chat.userId === employee2Id)
              ?.messageReceived || [];

          setChatHistory([
            ...employee1Received.map((msg: any) => ({
              ...msg,
              user: "employee1",
            })),
            ...employee2Received.map((msg: any) => ({
              ...msg,
              user: "employee2",
            })),
          ]);

          if (
            employee1Received.length === 0 &&
            employee2Received.length === 0
          ) {
            setEmptyStateMessage("No chats found between these employees.");
          }
        } else {
          setEmptyStateMessage("Error fetching chat history.");
        }
      } catch (error: any) {
        console.log(
          "Error fetching chat history:",
          error.response?.data || error.message
        );
        setEmptyStateMessage("Error fetching chat history.");
      } finally {
        setLoadingChats(false);
      }
    };

    fetchChatHistory();
  }, [selectedPair]);

  const generatePairs = (employees: any[], selectedEmployee: any) => {
    return employees
      .filter((employee) => employee._id !== selectedEmployee._id)
      .map((employee) => [selectedEmployee, employee]);
  };

  const pairs = selectedEmployee
    ? generatePairs(employees, selectedEmployee)
    : [];

  const renderChatItem = ({ item }: { item: any }) => (
    <View
      style={[
        styles.chatItem,
        item.user === "employee1" ? styles.received : styles.sent,
      ]}
    >
      <Text>{item.text}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {selectedEmployee && (
          <TouchableOpacity onPress={() => setSelectedEmployee(null)}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Employee Chats</Text>
        <View style={styles.userInfo}>
          <Image source={{ uri: user?.avatar }} style={styles.avatar} />
          <Text style={styles.username}>{user?.name}</Text>
        </View>
      </View>
      {loading && <ActivityIndicator size="large" color={primary} />}
      {emptyStateMessage ? (
        <Text style={styles.emptyText}>
          {emptyStateMessage && "No chats found"}
        </Text>
      ) : !selectedEmployee ? (
        <FlatList
          data={employees}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelectedEmployee(item)}
            >
              <View style={styles.cardContent}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.role}>{item.role}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : selectedEmployee && !selectedPair ? (
        <SectionList
          sections={[
            { title: "Pairs with " + selectedEmployee.name, data: pairs },
          ]}
          keyExtractor={(item, index) => `${item[0]._id}-${item[1]._id}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelectedPair(item)}
            >
              <View style={styles.pairContent}>
                <View style={styles.cardContent}>
                  <Image
                    source={{ uri: item[0].avatar }}
                    style={styles.avatar}
                  />
                  <View style={styles.info}>
                    <Text style={styles.name}>{item[0].name}</Text>
                    <Text style={styles.role}>{item[0].role}</Text>
                  </View>
                </View>
                <AntDesign
                  name="arrowright"
                  size={24}
                  color="black"
                  style={styles.pairArrow}
                />
                <View style={styles.cardContent}>
                  <Image
                    source={{ uri: item[1].avatar }}
                    style={styles.avatar}
                  />
                  <View style={styles.info}>
                    <Text style={styles.name}>{item[1].name}</Text>
                    <Text style={styles.role}>{item[1].role}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
        />
      ) : (
        <View>
          {loadingChats ? (
            <ActivityIndicator size="large" color={primary} />
          ) : (
            <FlatList
              data={chatHistory}
              keyExtractor={(item) => item._id}
              renderItem={renderChatItem}
              contentContainerStyle={styles.chatContainer}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  userInfo: {
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 16,
    color: "blue",
    textAlign: "center",
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 8,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  pairContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pairArrow: {
    marginHorizontal: 8,
  },
  info: {
    justifyContent: "center",
    marginLeft: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
  },
  role: {
    color: "#777",
    fontSize: 12,
  },
  chatItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 4,
    borderRadius: 8,
    maxWidth: "80%",
  },
  sent: {
    alignSelf: "flex-end",
    backgroundColor: "#e1ffc7",
  },
  received: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
  },
  timestamp: {
    color: "#999",
    fontSize: 12,
    textAlign: "right",
  },
  chatContainer: {
    paddingVertical: 8,
  },
});

export default BossTraceChats;
