<script>
  import { onMount, onDestroy } from "svelte";
  import {
    Room,
    ParticipantEvent,
    TrackEvent,
    Participant,
    RoomEvent,
    RemoteTrackPublication,
    RemoteParticipant,
    LocalParticipant,
    LocalTrackPublication,
    RemoteTrack,
    Track,
    VideoPresets,
    createLocalVideoTrack,
    createLocalAudioTrack,
  } from "livekit-client";
  import {
    createRoom,
    createToken,
    listRooms,
  } from "../../services/api-services";

  let room = new Room({
    adaptiveStream: true,

    dynacast: true,
    videoCaptureDefaults: {
      resolution: VideoPresets.h180.resolution,
    },
  });
  /**
   * @type {HTMLVideoElement}
   */
  let localVideoElement;
  let localVideoTrack;

  /**
   * @type {HTMLVideoElement}
   */
  let participantElement;
  /**
   * @type {number}
   */
  let roomSize = 0;

  async function connectToRoom() {
    const roomUrl = "wss://video-call-m23damml.livekit.cloud";
    let getRoom = await listRooms();
    if (getRoom.length === 0) {
      await createRoom({ room: 1 });
      getRoom = await listRooms();
    }
    const jwt = await createToken({
      roomName: getRoom[0].name,
      participant: "User",
    });
    // localVideoTrack = await createLocalVideoTrack();

    // // Menambahkan local video track ke video element
    // localVideoElement.srcObject = new MediaStream([
    //   localVideoTrack.mediaStreamTrack,
    // ]);
    room
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackPublished, handleTrackPublished)
      .on(RoomEvent.ParticipantConnected, (participant) => {
        console.log(`Participant connected: ${participant.identity}`);
      });

    await room.connect(roomUrl, jwt);
    await room.localParticipant.enableCameraAndMicrophone();
    roomSize = room.participants.size;
    console.log(room.state);
    console.log(room.participants);
    console.log(getRoom);
  }

  /**
   * @param {RemoteTrackPublication} publication
   * @param {RemoteParticipant} participant
   */
  async function handleTrackPublished(publication, participant) {
    console.log("publish track ok");
    localVideoTrack = await createLocalVideoTrack({
      facingMode: "user",
      resolution: VideoPresets.h720,
    });
    const audioTrack = await createLocalAudioTrack({
      echoCancellation: true,
      noiseSuppression: true,
    });

    const videoPublication = await room.localParticipant.publishTrack(
      localVideoTrack
    );
    const audioPublication = await room.localParticipant.publishTrack(
      audioTrack
    );
  }

  /**
   * @param {RemoteTrack} track
   * @param {RemoteTrackPublication} publication
   * @param {RemoteParticipant} participant
   */
  function handleTrackSubscribed(track, publication, participant) {
    track.attach(participantElement);
  }
  /**
   * @param {RemoteTrack} track
   * @param {RemoteTrackPublication} publication
   * @param {RemoteParticipant} participant
   */
  function handleTrackUnsubscribed(track, publication, participant) {
    // remove tracks from all attached elements
    track.detach();
  }
  /**
   * @param {LocalTrackPublication} track
   * @param {LocalParticipant} participant
   */
  function handleLocalTrackUnpublished(track, participant) {
    // when local tracks are ended, update UI to remove them from rendering
    // track.detach();
  }
  /**
   * @param {Participant[]} speakers
   */
  function handleActiveSpeakerChange(speakers) {
    // show UI indicators when participant is speaking
  }

  function handleDisconnect() {
    console.log("disconnected from room");
  }

  onMount(() => {
    connectToRoom();
  });

  onDestroy(() => {
    room.disconnect();
  });
</script>

<main>
  <h1>{roomSize}</h1>
  <div class="container" id="videoContainer">
    <video
      class="video-participant"
      id="localVideo"
      bind:this={localVideoElement}
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
