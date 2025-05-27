import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
const BASE_URL =
  import.meta.env.MODE === "developement" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoffingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.error("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("logged in successfully");
      get().connectSocket();
    } catch (error) {
        toast.error(error.response.data.message || "Login failed");
    } finally {
        set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
        await axiosInstance.get("/auth/logout");
        set({ authUser: null });
        toast.success("Logged out successfully") ;
        get().disconnectSocket();
    } catch (error) {
        toast.error(error.response.data.message  || "Logout failed");
    } 
    
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
        const res = await axiosInstance.put("auth/update-profile",date);
        set({ authUser: res.data });
        toast.success("Profile Update successfully");
    } catch (error ) {
        console.error("Error in updateProfile:", error);
        toast.error(error.response.data.message || "Profile update failed");
    } finally {
        set({ isUpdatingProfile: false });
    }
  },
   connestSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();
    set({ socket: socket  });
    socket.on("getOnlineUsers", (userIds) => {
        set({ onlineUsers: userIds });
    });
   },
    disconnectSocket: () => {
        if(get().socket?.connected) get().socket.disconnect();
    },
}));
