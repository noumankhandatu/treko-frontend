import { useState } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import FormField from "../../components/FormField";
import { images } from "../../constants";
import CustomButton from "@/components/CustomButton";

const baseURL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/register`;

const SignUp = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const submit = async () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "User registered successfully");
        router.replace("/sign-in");
      } else {
        Alert.alert("Error", data?.message || "Registration failed");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-white h-full px-6">
      <ScrollView>
        <View className="w-full flex justify-center items-center h-full ">
          <Image source={images.logo} className="w-[100px] h-[100px]" />
          <Text>{baseURL}</Text>
          <Text className="text-2xl font-semibold text-black mt-3 mb-10 font-psemibold">
            Treko Registration
          </Text>

          <FormField
            title=""
            value={form.name}
            handleChangeText={(e: any) => setForm({ ...form, name: e })}
            otherStyles=""
            keyboardType="default"
            placeholder={"Name"}
            secureTextEntry={undefined}
          />
          <FormField
            title=""
            value={form.email}
            handleChangeText={(e: any) => setForm({ ...form, email: e })}
            otherStyles=""
            keyboardType="email-address"
            placeholder={"Your Email"}
            secureTextEntry={undefined}
          />

          <FormField
            title=""
            placeholder={"Password"}
            value={form.password}
            handleChangeText={(e: any) => setForm({ ...form, password: e })}
            otherStyles={""}
            secureTextEntry
          />
          <FormField
            title=""
            placeholder={"Confirm Password"}
            value={form.confirmPassword}
            handleChangeText={(e: any) =>
              setForm({ ...form, confirmPassword: e })
            }
            otherStyles={""}
            secureTextEntry
          />

          {isSubmitting ? (
            <ActivityIndicator
              size="large"
              color="#0000ff"
              className="mt-10 w-full"
            />
          ) : (
            <CustomButton
              title="Register"
              handlePress={submit}
              containerStyles="mt-10 w-full"
              isLoading={isSubmitting}
            />
          )}

          <View className="flex justify-center pt-5 flex-row gap-2">
            <Link
              href="/sign-in"
              className="text-sm text-secondary font-pregular"
            >
              Already have an account?
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-primary font-psemibold"
            >
              Login?
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;