'use client';
import { toast } from "sonner";

export function useNotifications() {
    const showSuccess = (title, description) => {
        toast.success(title, {
            description,
            duration: 4000,
        });
    };

    const showError = (title, description) => {
        toast.error(title, {
            description,
            duration: 5000,
        });
    };

    const showInfo = (title, description) => {
        toast.info(title, {
            description,
            duration: 4000,
        });
    };

    const showWarning = (title, description) => {
        toast.warning(title, {
            description,
            duration: 4000,
        });
    };

    // Connection specific notifications
    const connectionRequestSent = (userName) => {
        showSuccess("Connection Request Sent", `Your connection request has been sent to ${userName}`);
    };

    const connectionAccepted = (userName) => {
        showSuccess("Connection Accepted", `You are now connected with ${userName}`);
    };

    const connectionRejected = (userName) => {
        showInfo("Connection Request Declined", `${userName} declined your connection request`);
    };

    const connectionRequestReceived = (userName) => {
        showInfo("New Connection Request", `${userName} wants to connect with you`);
    };

    return {
        showSuccess,
        showError,
        showInfo,
        showWarning,
        connectionRequestSent,
        connectionAccepted,
        connectionRejected,
        connectionRequestReceived
    };
}
