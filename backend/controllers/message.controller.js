import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUser = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: loggedInUser}}).select("-password");
        res.status(200).json({
            message: "Users fetched successfully",
            users: filteredUsers,
        });
    } catch (error) {
        console.error("Error in getUsersForSidebar controller:", error.message);
        res.status(500).json({
            message: "Server error, please try again later",
        });
    }
};


export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        if (!userToChatId || userToChatId === myId.toString()) {
            return res.status(400).json({ message: "Invalid user ID to chat with." });
        }

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        })
        .sort({ createdAt: 1 })         // oldest to newest
        .select("-__v")                 // clean output
        .lean();                        // faster if you don’t need Mongoose documents

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages controller:", error.message);
        res.status(500).json({
            message: "Server error, please try again later",
        });
    }
};



export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl = "";
    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
      } catch (err) {
        console.error("Image upload failed:", err.message);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Emit message in real-time using Socket.IO
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error.message);
    res.status(500).json({
      message: "Server error, please try again later",
    });
  }
};
