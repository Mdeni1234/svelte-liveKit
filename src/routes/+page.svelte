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
  let localVideoElement;
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
    remoteParticipants = remoteParticipants.filter(
      (element) => element.identity !== participant.identity
    );
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
      const localParticipantId = room.localParticipant.sid;

      if (participant.sid === localParticipantId) {
        videoElement.classList.add("local-video");
      }
      track.attach(videoElement);
      // @ts-ignore
      document.getElementById("videoContainer").appendChild(videoElement);
    }
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
  <h1>Video Call</h1>

  <div id="videoContainer" />
</main>

<style>
  #videoContainer {
    display: flex;
    place-items: center;
    position: relative;
    min-width: 100vw;
    min-height: 100vh;
  }
  .videoContainer video {
    position: absolute;
    width: 100%;
    max-height: 100vh;
  }
  .videoContainer video.local-video {
    position: absolute;
    right: 1;
    top: 1;
    margin: 10px;
    width: 200px;
    height: auto;
  }
</style>
