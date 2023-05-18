<script>
  // @ts-nocheck

  import { onMount, onDestroy } from "svelte";
  import { RoomEvent, Room } from "livekit-client";
  import {
    createRoom,
    createToken,
    listRooms,
  } from "../../services/api-services";

  let room = new Room({
    audioCaptureDefaults: {
      autoGainControl: true,
      deviceId: "",
      echoCancellation: true,
      noiseSuppression: true,
    },
    videoCaptureDefaults: {
      deviceId: "",
      facingMode: "user",
      resolution: {
        width: 1280,
        height: 720,
        frameRate: 30,
      },
    },
    publishDefaults: {
      videoEncoding: {
        maxBitrate: 1_500_000,
        maxFramerate: 30,
      },
      screenShareEncoding: {
        maxBitrate: 1_500_000,
        maxFramerate: 30,
      },
      audioBitrate: 20_000,
      dtx: true,
      videoSimulcastLayers: [
        {
          width: 640,
          height: 360,
          encoding: {
            maxBitrate: 500_000,
            maxFramerate: 20,
          },
        },
        {
          width: 320,
          height: 180,
          encoding: {
            maxBitrate: 150_000,
            maxFramerate: 15,
          },
        },
      ],
    },
  });
  /**
   * @type {HTMLVideoElement}
   */
  let localVideoElement;
  let localVideoTrack;
  let remoteParticipants = [];

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
      .on(RoomEvent.Connected, handleConnected)
      .on(RoomEvent.ParticipantConnected, handleParticipantConected)
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    await room.connect(roomUrl, jwt);
  }
  function handleConnected() {
    console.log("connect yey");
  }
  function handleParticipantConected(participant) {
    console.log(`Participant connected: ${participant}`);
    remoteParticipants = [...remoteParticipants, participant];
    console.log(remoteParticipants);
  }

  const handleTrackSubscribed = (track, publication, participant) => {
    // track.attach(participantElement);
    console.log("track subscriber ok");
  };
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
