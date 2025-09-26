import { auth } from '@/firebase';

interface EmailRecipient {
  to_email: string;
  to_name: string;
}

interface EmailNotificationData {
  from_name: string;
  group_name: string;
  rating: number;
  note?: string;
  recipients: EmailRecipient[];
}

class EmailService {
  private readonly BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  constructor() {
    if (!this.BACKEND_URL) {
      console.warn('Backend URL is not set. Email notifications will be disabled.');
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Add Firebase ID token for authentication
    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      } catch (error) {
        console.error('Failed to get Firebase ID token:', error);
        throw new Error('Authentication failed');
      }
    } else {
      throw new Error('User not authenticated');
    }

    return headers;
  }

  async sendRatingNotification(data: EmailNotificationData): Promise<void> {
    if (!this.BACKEND_URL) {
      console.warn('Backend URL not configured, skipping email notification');
      return;
    }

    try {
      const headers = await this.getAuthHeaders();
      const endpoint = `${this.BACKEND_URL}/mail/group-announcement`;

      const payload = {
        data: {
          from_name: data.from_name,
          group_name: data.group_name,
          rating: data.rating,
          message: this.getRatingMessage(data.rating),
          note: data.note || '',
          recipients: data.recipients,
        },
        timestamp: new Date().toISOString(),
        event: 'rating_notification',
      };

      console.log('Backend URL:', endpoint);
      console.log('Sending notification with payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      console.log('Email notification sent successfully');
    } catch (error) {
      console.error('Failed to send email notification:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      // Don't throw the error to prevent disrupting the rating flow
    }
  }

  private getRatingMessage(rating: number): string {
    if (rating <= 2) return '😢';
    if (rating <= 4) return '😕';
    if (rating <= 6) return '😐';
    if (rating <= 8) return '🙂';
    return '😊';
  }
}

export const emailService = new EmailService();
