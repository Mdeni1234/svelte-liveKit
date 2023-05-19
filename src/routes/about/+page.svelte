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
  } from "../../services/api-services";

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
    console.log(`Track subscribed: ${track.sid}`);
    console.log(publication);
    console.log(participant);
    if (track.kind === Track.Kind.Video) {
      const videoElement = document.createElement("video");
      videoElement.autoplay = true;
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

<!-- <main>
  <h1>{roomSize}</h1>
  <div class="container" id="videoContainer">
    <video
      class="video-participant"
      id="localVideo"
      bind:this={localVideoTrack}
      autoplay
      muted
    />
    <video
      class="video-participant"
      bind:this={participantElement}
      autoplay
      muted
    />
  </div>
</main> -->
<main>
  <h1>Svelte LiveKit Example</h1>

  <button on:click={publishTracks}>Publish Audio</button>

  <h2>Remote Participants:</h2>

  <div id="videoContainer" />
</main>

<style>
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .video-participant {
    display: flex;
    width: 100%;
    place-items: center;
  }
</style>
