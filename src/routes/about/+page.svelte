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
  } from "livekit-client";
  import {
    createRoom,
    createToken,
    listRooms,
  } from "../../services/api-services";

  let room = new Room();
  /**
   * @type {Participant | any}
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
    await room.connect(roomUrl, jwt);
    localParticipant = room.localParticipant;
    console.log(room.participants);
  }
  room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
  room.on("participantDisconnected", handleParticipantDisconnected);
  room.on("trackPublished", handleTrackPublished);
  room.on("trackUnpublished", handleTrackUnpublished);

  /**
   * @param {{ identity: any; }} participant
   */
  function handleParticipantConnected(participant) {
    remoteParticipants = [...remoteParticipants, participant];
    console.log(room.participants.size);
  }

  /**
   * @param {{ identity: any; }} participant
   */
  function handleParticipantDisconnected(participant) {
    console.log("Remote participant disconnected:", participant.identity);
    // Lakukan tindakan yang sesuai
  }

  /**
   * @param {{ kind: any; }} publication
   * @param {{ identity: any; }} participant
   */
  function handleTrackPublished(publication, participant) {
    console.log("Track published by:", participant.identity);
    console.log("Publication kind:", publication.kind);
    // Lakukan tindakan yang sesuai
  }

  /**
   * @param {{ kind: any; }} publication
   * @param {{ identity: any; }} participant
   */
  function handleTrackUnpublished(publication, participant) {
    console.log("Track unpublished by:", participant.identity);
    console.log("Publication kind:", publication.kind);
    // Lakukan tindakan yang sesuai
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

  <h2>Local Participant:</h2>
  {#if localParticipant && localParticipant.videoTracks}
    <video
      class="participant"
      bind:this={localParticipant.videoTracks}
      autoplay={true}
      muted={true}
    >
      <track kind="captions" srclang="en" label="English" default />
    </video>
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
