import {apiUrl} from "../utils/api_url.js"
/**
 * @param {{roomName : string, 
 *          participant : string}} item
 */
export async function createToken(item) {
    const data = {
        roomName : item.roomName,
        participant: item.participant
    }
  try {
    const response = await fetch(`${apiUrl}/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create data');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
/**
 * @param {{ room: number; }} item
 */
export async function createRoom(item) {
    const data = {
      room: item.room + 1
    }
  try {
    const response = await fetch(`${apiUrl}/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create data');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
export async function listRooms() {
    try {
      const response = await fetch(`${apiUrl}/rooms`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
  
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }



/**
 * @param {number} id
 */
export async function remove(id) {
  try {
    const response = await fetch(`${apiUrl}/rooms/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete data');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}