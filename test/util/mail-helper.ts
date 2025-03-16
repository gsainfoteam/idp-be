import axios, { AxiosResponse } from 'axios';

import { TestContainers } from '../setup/singleton';

export interface Email {
  subject: string;
  text: string;
  to: string[];
  from: string;
}

interface GreenMailEmail {
  subject: string;
  text: string;
  recipients: {
    to: string[];
  };
  from: string;
}

export const getLastEmail = async (to: string): Promise<Email | null> => {
  const { host, apiPort } = TestContainers.getInstance().mailConfig;
  try {
    const response: AxiosResponse<GreenMailEmail[]> = await axios.get(
      `http://${host}:${apiPort}/api/v1/emails?to=${to}`,
    );

    if (!response.data || response.data.length === 0) {
      return null;
    }

    const email = response.data[0];
    return {
      subject: email.subject,
      text: email.text,
      to: email.recipients.to,
      from: email.from,
    };
  } catch (error) {
    console.error('Failed to fetch email:', error);
    return null;
  }
};

export const waitForEmail = async (
  to: string,
  timeoutMs = 5000,
  intervalMs = 100,
): Promise<Email | null> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const email = await getLastEmail(to);
    if (email) {
      return email;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
};
