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
   * @type {LocalParticipant | any}
   */
  let localParticipant;
  /**
   * @type {RemoteParticipant[] | any[]}
   */
  let participantVideoElements = [];

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

    await room.connect(roomUrl, jwt);
    await room.localParticipant.enableCameraAndMicrophone();
    console.log(room);
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
    participantVideoElements.push(videoElement);
  }
  /**
   * @param {RemoteTrackPublication} publication
   * @param {RemoteParticipant} participant
   */
  function handleTrackPublished(publication, participant) {
    console.log("track publised");
    if (publication.kind === "video") {
      const videoTrack = publication.track;
      // @ts-ignore
      displayVideoTrack(videoTrack);
    }
  }

  room.participants.forEach((participant) => {
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
    console.log(track);
    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
      const element = track.attach();
      const parentElement = document.getElementById("local-video");
      // @ts-ignore
      parentElement.appendChild(element);
    }
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
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log("participant connected");
      participant.videoTracks.forEach((publication) => {
        const videoTrack = publication.track;
        displayVideoTrack(videoTrack);
      });
    });

    // Event participantDisconnected
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      // Menghapus video element dari participant yang keluar dari room
      participantVideoElements = participantVideoElements.filter(
        (element) => element.srcObject !== participant.videoTracks
      );
    });
    room
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChange)
      .on(RoomEvent.Disconnected, handleDisconnect)
      .on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)
      .on(RoomEvent.TrackPublished, handleTrackPublished);

    // Menampilkan video participant yang telah bergabung sebelumnya di room
    room.participants.forEach((participant) => {
      participant.videoTracks.forEach((publication) => {
        const videoTrack = publication.track;
        displayVideoTrack(videoTrack);
      });
    });
  });

  onDestroy(() => {
    room.disconnect();
  });
</script>

<main>
  <div id="videoContainer" />
</main>

<style>
  .participant {
    width: 100%;
    background: red;
  }
  .remote-participant {
    width: 100%;
    background: black;
  }
</style>
