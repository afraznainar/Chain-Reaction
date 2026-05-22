
export async function fetchRecentEmails(accessToken: string) {
  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Gmail API Error Response:', errorText);
      return [];
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Gmail API returned non-JSON response');
      return [];
    }

    const data = await response.json();
    if (!data.messages) return [];
    
    const messages = await Promise.all(data.messages.map(async (msg: any) => {
      try {
        const detailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        });
        
        if (!detailResponse.ok) return null;
        
        const detailContentType = detailResponse.headers.get('content-type');
        if (!detailContentType || !detailContentType.includes('application/json')) return null;
        
        return detailResponse.json();
      } catch (e) {
        return null;
      }
    }));
    
    return messages.filter(msg => msg !== null).map((msg: any) => {
      const subjectHeader = msg.payload.headers.find((h: any) => h.name === 'Subject');
      const fromHeader = msg.payload.headers.find((h: any) => h.name === 'From');
      return {
        id: msg.id,
        snippet: msg.snippet,
        subject: subjectHeader ? subjectHeader.value : '(No Subject)',
        from: fromHeader ? fromHeader.value : '(Unknown Sender)',
        date: new Date(parseInt(msg.internalDate)).toLocaleDateString(),
      };
    });
  } catch (error) {
    console.error('Gmail Fetch Error:', error);
    return [];
  }
}

export async function sendGameInvite(accessToken: string, toEmail: string, roomLink: string) {
  try {
    const rawMessage = [
      `To: ${toEmail}`,
      'Subject: Join my Chain Reaction game!',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      `Hey! Come play Chain Reaction with me. Join the room here: ${roomLink}`,
    ].join('\r\n');

    const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send invite: ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Gmail API returned non-JSON response on send');
    }

    return await response.json();
  } catch (error) {
    console.error('Gmail Send Error:', error);
    throw error;
  }
}
