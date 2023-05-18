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
      resolution: VideoPresets.h720.resolution,
    },
  });
  /**
   * @type {HTMLVideoElement}
   */
  let localVideoElement;
  let localVideoTrack;

  /**
   * @type {LocalParticipant | any}
   */
  let localParticipant;
  /**
   * @type {RemoteParticipant[] | any[]}
   */
  let participantVideoTracks = [];
  /**
   * @type {HTMLVideoElement}
   */
  let participantElement;

  async function connectToRoom() {
    const roomUrl = "wss://video-call-m23damml.livekit.cloud";
    let getRoom = await listRooms();
    if (getRoom.length === 0) {
      await createRoom({ room: 1 });
      getRoom = await listRooms();
    }
    const jwt = await createToken({
      roomName: getRoom[0].name,
      participant: "Deni",
    });
    localVideoTrack = await createLocalVideoTrack();

    // Menambahkan local video track ke video element
    localVideoElement.srcObject = new MediaStream([
      localVideoTrack.mediaStreamTrack,
    ]);
    await room.connect(roomUrl, jwt);
    await room.localParticipant.enableCameraAndMicrophone();
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    // room.on(RoomEvent.ParticipantConnected, (participant) => {
    //   console.log("participant connected");
    //   participant.videoTracks.forEach((publication) => {
    //     const videoTrack = publication.track;
    //     displayVideoTrack(videoTrack);
    //   });
    // });

    // // Event participantDisconnected
    // room.on(RoomEvent.ParticipantDisconnected, (participant) => {
    //   // Menghapus video element dari participant yang keluar dari room
    //   participantVideoTracks = participantVideoTracks.filter(
    //     (element) => element.srcObject !== participant.videoTracks
    //   );
    // });
    // room
    //   .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
    //   .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChange)
    //   .on(RoomEvent.Disconnected, handleDisconnect)
    //   .on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)
    //   .on(RoomEvent.TrackPublished, handleTrackPublished)
    //   .on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

    // // Menampilkan video participant yang telah bergabung sebelumnya di room
    // room.participants.forEach((participant) => {
    //   participant.videoTracks.forEach((publication) => {
    //     const videoTrack = publication.track;
    //     displayVideoTrack(videoTrack);
    //   });
    // });
  }

  /**
   * @param {any} videoTrack
   */
  function displayVideoTrack(videoTrack) {
    const videoElement = document.createElement("video");
    // @ts-ignore
    videoElement.srcObject = new MediaStream([videoTrack]);
    videoElement.autoplay = true;
    videoElement.muted = true;

    const videoContainer = document.getElementById("videoContainer");
    // @ts-ignore
    videoContainer.appendChild(videoElement);

    // Menyimpan video element dalam array
    // @ts-ignore
    participantVideoTracks.push(videoElement);
  }
  /**
   * @param {RemoteTrackPublication} publication
   * @param {RemoteParticipant} participant
   */
  function handleTrackPublished(publication, participant) {
    console.log("track published");

    participantVideoTracks = [...participantVideoTracks, participant];
    const videoTrack = publication.track;

    const videoElement = document.createElement("video");
    // @ts-ignore
    videoElement.srcObject = new MediaStream([videoTrack.mediaStreamTrack]);
    videoElement.autoplay = true;
    videoElement.muted = false;
    videoElement.classList.add("video-participant");
    // @ts-ignore
    document.getElementById("videoContainer").appendChild(videoElement);
  }

  room.participants.forEach((participant) => {
    console.log(participant.videoTracks);
    participant.videoTracks.forEach((publication) => {
      const videoTrack = publication.track;
      // @ts-ignore
      displayVideoTrack(videoTrack);
    });
  });
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
    console.log(participantVideoTracks);
  });

  onDestroy(() => {
    room.disconnect();
  });
</script>

<main>
  <h1>{room.participants.size}</h1>
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
