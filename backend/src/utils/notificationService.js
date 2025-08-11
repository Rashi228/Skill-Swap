const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Create a swap request notification
   */
  static async createSwapRequestNotification(recipientId, senderId, swapId, swapTitle) {
    try {
      return await Notification.createSwapRequest(recipientId, senderId, swapId, swapTitle);
    } catch (error) {
      console.error('Error creating swap request notification:', error);
      throw error;
    }
  }

  /**
   * Create a swap accepted notification
   */
  static async createSwapAcceptedNotification(recipientId, swapId, swapTitle) {
    try {
      return await Notification.createSwapAccepted(recipientId, swapId, swapTitle);
    } catch (error) {
      console.error('Error creating swap accepted notification:', error);
      throw error;
    }
  }

  /**
   * Create a swap declined notification
   */
  static async createSwapDeclinedNotification(recipientId, swapId, swapTitle) {
    try {
      return await Notification.createSwapDeclined(recipientId, swapId, swapTitle);
    } catch (error) {
      console.error('Error creating swap declined notification:', error);
      throw error;
    }
  }

  /**
   * Create a swap reminder notification
   */
  static async createSwapReminderNotification(recipientId, swapId, swapTitle, scheduledDate) {
    try {
      return await Notification.createSwapReminder(recipientId, swapId, swapTitle, scheduledDate);
    } catch (error) {
      console.error('Error creating swap reminder notification:', error);
      throw error;
    }
  }

  /**
   * Create a message notification
   */
  static async createMessageNotification(recipientId, senderId, message, swapId) {
    try {
      return await Notification.createMessageNotification(recipientId, senderId, message, swapId);
    } catch (error) {
      console.error('Error creating message notification:', error);
      throw error;
    }
  }

  /**
   * Create a review notification
   */
  static async createReviewNotification(recipientId, senderId, rating, swapId) {
    try {
      return await Notification.createReviewNotification(recipientId, senderId, rating, swapId);
    } catch (error) {
      console.error('Error creating review notification:', error);
      throw error;
    }
  }

  /**
   * Create a skill match notification
   */
  static async createSkillMatchNotification(recipientId, matchedUserId, skillName) {
    try {
      return await Notification.createSkillMatch(recipientId, matchedUserId, skillName);
    } catch (error) {
      console.error('Error creating skill match notification:', error);
      throw error;
    }
  }

  /**
   * Create a reward notification
   */
  static async createRewardNotification(recipientId, amount, reason) {
    try {
      return await Notification.createRewardNotification(recipientId, amount, reason);
    } catch (error) {
      console.error('Error creating reward notification:', error);
      throw error;
    }
  }

  /**
   * Create a badge notification
   */
  static async createBadgeNotification(recipientId, badgeName, badgeDescription) {
    try {
      return await Notification.createBadgeNotification(recipientId, badgeName, badgeDescription);
    } catch (error) {
      console.error('Error creating badge notification:', error);
      throw error;
    }
  }

  /**
   * Create a system notification
   */
  static async createSystemNotification(recipientId, title, content, priority = 'medium') {
    try {
      return await Notification.createSystemNotification(recipientId, title, content, priority);
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulkNotifications(recipientIds, notificationData) {
    try {
      const notifications = recipientIds.map(recipientId => ({
        ...notificationData,
        recipient: recipientId
      }));

      return await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Create a swap completion notification for all participants
   */
  static async createSwapCompletionNotifications(swap, participants) {
    try {
      const notifications = participants.map(participant => ({
        recipient: participant.user,
        type: 'swap_completed',
        title: 'Swap Completed',
        content: `Your swap "${swap.title}" has been completed!`,
        data: { swapId: swap._id },
        priority: 'medium',
        actions: [
          { label: 'Leave Review', action: 'leave_review', url: `/swaps/${swap._id}/review` },
          { label: 'View Swap', action: 'view_swap', url: `/swaps/${swap._id}` }
        ]
      }));

      return await Notification.insertMany(notifications);
    } catch (error) {
      console.error('Error creating swap completion notifications:', error);
      throw error;
    }
  }

  /**
   * Create a swap cancellation notification
   */
  static async createSwapCancellationNotification(recipientId, swapId, swapTitle, reason = '') {
    try {
      return await Notification.create({
        recipient: recipientId,
        type: 'swap_cancelled',
        title: 'Swap Cancelled',
        content: `Your swap "${swapTitle}" has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
        data: { swapId },
        priority: 'high',
        actions: [
          { label: 'Find Other Swaps', action: 'browse_swaps', url: '/swaps' }
        ]
      });
    } catch (error) {
      console.error('Error creating swap cancellation notification:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications() {
    try {
      const result = await Notification.updateMany(
        {
          expiresAt: { $lt: new Date() },
          isActive: true
        },
        {
          isActive: false
        }
      );

      console.log(`Cleaned up ${result.modifiedCount} expired notifications`);
      return result.modifiedCount;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getUserNotificationStats(userId) {
    try {
      const stats = await Notification.aggregate([
        { $match: { recipient: userId, isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
            byType: {
              $push: {
                type: '$type',
                isRead: '$isRead'
              }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return { total: 0, unread: 0, byType: {} };
      }

      const byType = {};
      stats[0].byType.forEach(item => {
        if (!byType[item.type]) {
          byType[item.type] = { total: 0, unread: 0 };
        }
        byType[item.type].total++;
        if (!item.isRead) {
          byType[item.type].unread++;
        }
      });

      return {
        total: stats[0].total,
        unread: stats[0].unread,
        byType
      };
    } catch (error) {
      console.error('Error getting user notification stats:', error);
      throw error;
    }
  }
}

module.exports = NotificationService; 