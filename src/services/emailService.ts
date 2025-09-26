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
  private readonly BACKEND_URL = import.meta.env.VITE_EMAIL_WEBHOOK_URL;

  constructor() {
    if (!this.BACKEND_URL) {
      console.warn('Backend URL is not set. Email notifications will be disabled.');
    }
  }

  async sendRatingNotification(data: EmailNotificationData): Promise<void> {
    if (!this.BACKEND_URL) {
      console.warn('Backend URL not configured, skipping email notification');
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      const endpoint = `${this.BACKEND_URL}`;

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
