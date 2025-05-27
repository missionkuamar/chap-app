import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from " react-hot-toast";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  message: null,
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message || "failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({
      isMessagesLoading: true,
    });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ message: res.data });
    } catch (error) {
      toast.error(error.response.data.message || "failed to fetch messages");
    } finally {
      set({
        isMessagesLoading: false,
      });
    }
  },

  sendMessage : async (messageData) => {
    const { selectedUser, messages } = get();
    try {
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
        set({ message: [...messages, res.data]});
    } catch (error ) {
        toast.error(error.response.data.message || "failed to send message");
    }
  },

  subscribeTomessages: () => {
    const { selectedUser } = get();
    if(!selectedUser) return;
    const socket = useAuthStore.getSate().socket;
    socket.on("newMessage", (newMessage) => {
        const isMessageSentFromSelectedUser = newMessage.senderId ===  selectedUser._id;
        if(!isMessageSentFromSelectedUser) return;
        set({
            messages: [...get().messages, newMessage],
        })
    })
  },
  unsubscribeFromMessage: () => {
    const socket  = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
  setSelectedUser: (selectedUser) => set({ selectedUser}),
}));
