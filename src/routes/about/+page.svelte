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
  let remoteParticipants = [];

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
    room
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChange)
      .on(RoomEvent.Disconnected, handleDisconnect)
      .on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);

    await room.connect(roomUrl, jwt);
    localParticipant = room.localParticipant;
    const videoElement = document.createElement("video");
    const setVideoElement = document.getElementById("local-video");
    videoElement.srcObject = localParticipant.videoTrack;
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    // @ts-ignore
    setVideoElement.appendChild(videoElement);
    console.log(localParticipant);
    // publish local camera and mic tracks
    await room.localParticipant.enableCameraAndMicrophone();

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
  }

  onMount(() => {
    connectToRoom();
  });

  onDestroy(() => {
    room.disconnect();
  });
</script>

<div>
  <h1>Video Call</h1>

  <h2>Local Participant</h2>
  {#if localParticipant && localParticipant.videoTracks}
    <div id="local-video" />
  {/if}
  <h2>Remote Participants:</h2>
  {#each remoteParticipants as participant}
    {#if participant.videoTrack}
      <div>
        <h3>{participant.identity}</h3>
        <video
          class="remote-participant"
          bind:this={participant.videoTrack}
          autoplay={true}
        >
          <track kind="captions" srclang="en" label="English" default />
        </video>
      </div>
    {/if}
  {/each}
</div>

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
