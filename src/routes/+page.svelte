<script>
  import { onMount, onDestroy } from "svelte";
  import {
    RoomEvent,
    Room,
    createLocalVideoTrack,
    RemoteParticipant,
    VideoPresets,
    createLocalAudioTrack,
    Participant,
    RemoteTrack,
    RemoteTrackPublication,
    RemoteVideoTrack,
    Track,
  } from "livekit-client";
  import {
    createRoom,
    createToken,
    listRooms,
  } from "./../services/api-services";

  const randomNumber = Math.floor(Math.random() * 10) + 1;
  /**
   * @type {Room}
   */
  let room;
  let roomName = "";
  /**
   * @type {RemoteParticipant[]}
   */
  let remoteParticipants = [];
  /**
   * @type {RemoteVideoTrack[]}
   */
  let remoteVideoElements;

  async function connectToRoom() {
    const roomUrl = "wss://video-call-m23damml.livekit.cloud";
    let getRoom = await listRooms();
    if (getRoom.length === 0) {
      await createRoom({ room: 1 });
      getRoom = await listRooms();
    }
    const jwt = await createToken({
      roomName: getRoom[0].name,
      participant: `user ${randomNumber}`,
    });
    room = new Room();
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    await room.connect(roomUrl, jwt);
    roomName = room.name;
    console.log(room.participants, room.name);
    await publishTracks();
  }
  async function publishTracks() {
    const videoTrack = await createLocalVideoTrack({
      facingMode: "user",
      // preset resolutions
      resolution: VideoPresets.h216,
    });
    const audioTrack = await createLocalAudioTrack({
      echoCancellation: true,
      noiseSuppression: true,
    });

    await room.localParticipant.publishTrack(videoTrack);
    await room.localParticipant.publishTrack(audioTrack);
  }

  function handleConnected() {
    console.log("Connected to room");
    console.log(room);
  }

  /**
  
	 * @param {RemoteParticipant} participant
	 */
  function handleParticipantConnected(participant) {
    console.log(participant);
  }

  /**
   * @param {Participant} participant
   */
  function handleParticipantDisconnected(participant) {
    console.log(`Participant disconnected: ${participant.identity}`);
  }

  /**
   * @param {RemoteTrack} track
   * @param {RemoteTrackPublication} publication
   * @param {RemoteParticipant} participant
   */
  function handleTrackSubscribed(track, publication, participant) {
    if (track.kind === Track.Kind.Video) {
      const videoElement = document.createElement("video");
      videoElement.autoplay = true;
      videoElement.style.position = "absolute";

      videoElement.style.right = " 0";
      const localParticipantId = room.localParticipant.sid;
      if (participant.sid === localParticipantId) {
        videoElement.style.top = " 0";
        videoElement.style.margin = "10px";
        videoElement.style.width = "200px";
        videoElement.style.height = "auto";
        videoElement.style.zIndex = "2";
      } else {
        videoElement.style.width = "100%";
        videoElement.style.maxHeight = "100vh";
        videoElement.style.zIndex = "1";
        videoElement.style.left = "0";
      }
      track.attach(videoElement);
      // @ts-ignore
      document.getElementById("videoContainer").appendChild(videoElement);
    }
  }
  function handleRoom() {
    room ? room.disconnect() : connectToRoom();
  }

  onMount(() => {
    connectToRoom();
  });

  onDestroy(() => {
    if (room) {
      room.disconnect();
    }
  });
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte video call app" />
</svelte:head>

<main>
  <div class="container">
    <div class="video-nav">
      <h2>{room && roomName}</h2>
      <button on:click={() => handleRoom()}
        >{room ? "Leave Room" : "connect"}</button
      >
    </div>

    <div id="videoContainer" />
  </div>
</main>

<style>
  .container {
    display: flex;
    width: 100%;
    height: 100%;
    max-width: 100vw;
    max-height: 100vh;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  .video-nav {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 0 10px;
  }
  .video-nav h2 {
    text-transform: uppercase;
    color: white;
    margin-left: auto;
  }
  .video-nav button {
    color: white;
    margin-left: auto;
    padding: 4px 0;
    height: 30px;
    padding: 5px 10px;
    overflow: hidden;
    user-select: none;
    background-color: #ff3e00;
    border-radius: 10;
    border: none;
    text-decoration: none;
  }

  .video-nav button:hover {
    background: #ab0000;
    text-decoration: none;
  }
  #videoContainer {
    display: flex;
    justify-content: center;
    place-items: center;
    position: relative;
    min-width: 100%;
    min-height: 100%;
  }
  #videoContainer video {
    position: absolute;
    width: 100%;
    max-height: 100vh;
    z-index: 1;
    right: 0;
    left: 0;
  }
  #videoContainer video.local-video {
    position: absolute;
    right: 0;
    top: 0;
    margin: 10px;
    width: 200px;
    z-index: 2;
    height: auto;
  }
</style>
