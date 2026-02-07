const ZOOM_API_URL = 'https://api.zoom.us/v2';

async function getZoomAccessToken() {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
        throw new Error('Zoom credentials (ACCOUNT_ID, CLIENT_ID, CLIENT_SECRET) are missing');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to get Zoom access token: ${error}`);
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Zoom OAuth Error:', error);
        throw error;
    }
}

export async function createZoomMeeting(topic: string, startTime: Date, duration: number = 60) {
    try {
        const accessToken = await getZoomAccessToken();

        const response = await fetch(`${ZOOM_API_URL}/users/me/meetings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: topic,
                type: 2, // Scheduled meeting
                start_time: startTime.toISOString(),
                duration: duration,
                timezone: 'UTC', // Adjust as needed
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: false,
                    mute_upon_entry: true,
                    waiting_room: true
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create Zoom meeting: ${error}`);
        }

        const meeting = await response.json();

        return {
            id: meeting.id.toString(),
            join_url: meeting.join_url,
            start_url: meeting.start_url,
            password: meeting.password
        };
    } catch (error) {
        console.error('Create Zoom Meeting Error:', error);
        // Fallback or rethrow depending on desired behavior. For now, we rely on the error appearing in logs.
        throw error;
    }
}
