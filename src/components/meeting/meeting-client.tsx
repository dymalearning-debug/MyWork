"use client";

import {
  isTrackReference,
  LiveKitRoom,
  RoomAudioRenderer,
  useChat,
  useLocalParticipant,
  useMediaDevices,
  usePreviewTracks,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
  useTrackToggle,
  VideoTrack,
} from "@livekit/components-react";
import { LocalAudioTrack, LocalVideoTrack, Track } from "livekit-client";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  LoaderCircleIcon,
  MessageSquareIcon,
  MicIcon,
  MicOffIcon,
  MonitorUpIcon,
  SendIcon,
  VideoIcon,
  VideoOffIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { StatusDot } from "@/components/status-dot";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { formatDate, formatTime, formatTimeRange } from "@/lib/booking/format";
import { ROOM_CLOSING_WARNING_MINUTES } from "@/lib/booking/rules";
import { cn } from "@/lib/utils";

// The meeting itself (docs/booking.md, "Visio"), mockups "Visio — Écran de préparation" and
// "Visio — Dans la salle": LiveKit's React building blocks, dressed in the design system. The
// videos sit on a fixed ink stage (`stage`), in both themes.

export type MeetingDetails = {
  tokenUrl: string;
  // Where "Quitter" and the way back lead: "Mes rendez-vous" for the owner, the booking for the guest.
  backHref: string;
  backLabel: string;
  // The guest's link, to copy from the room ("Copier le lien de l'invité" for the owner).
  shareLink: { path: string; label: string };
  startAt: string;
  endAt: string;
  closesAt: string;
  selfName: string;
  otherName: string;
  timeZone: string;
};

type Choices = { micOn: boolean; camOn: boolean; micId: string; camId: string; speakerId: string };
type Access = { token: string; serverUrl: string };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function MeetingClient(details: MeetingDetails) {
  const router = useRouter();
  const [choices, setChoices] = useState<Choices | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enter(next: Choices) {
    setChoices(next);
    setError(null);
    try {
      const response = await fetch(details.tokenUrl, { method: "POST" });
      const result = (await response.json()) as { ok: boolean; token?: string; serverUrl?: string; reason?: string };
      if (!result.ok || !result.token || !result.serverUrl) {
        setChoices(null);
        setError(
          result.reason === "early"
            ? "La salle n'est pas encore ouverte. Revenez 15 minutes avant le rendez-vous."
            : result.reason === "over"
              ? "La salle est fermée."
              : result.reason === "cancelled"
                ? "Ce rendez-vous a été annulé."
                : "La salle n'a pas pu être ouverte. Réessayez.",
        );
        return;
      }
      setAccess({ token: result.token, serverUrl: result.serverUrl });
    } catch {
      setChoices(null);
      setError("La salle n'a pas pu être ouverte. Vérifiez votre connexion, puis réessayez.");
    }
  }

  if (!access || !choices) {
    return <PrepScreen details={details} entering={!!choices} error={error} onEnter={enter} onBack={() => router.push(details.backHref)} />;
  }

  return (
    <LiveKitRoom
      serverUrl={access.serverUrl}
      token={access.token}
      connect
      audio={choices.micOn ? { deviceId: choices.micId || undefined } : false}
      video={choices.camOn ? { deviceId: choices.camId || undefined } : false}
      options={{ audioOutput: choices.speakerId ? { deviceId: choices.speakerId } : undefined, adaptiveStream: true, dynacast: true }}
      onDisconnected={() => router.push(details.backHref)}
      onError={(e) => console.error(e)}
      className="flex h-svh flex-col overflow-hidden bg-background text-foreground"
    >
      <RoomView details={details} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// ——— Preparation screen ———

function PrepScreen({
  details,
  entering,
  error,
  onEnter,
  onBack,
}: {
  details: MeetingDetails;
  entering: boolean;
  error: string | null;
  onEnter: (choices: Choices) => void;
  onBack: () => void;
}) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [micId, setMicId] = useState("");
  const [camId, setCamId] = useState("");
  const [speakerId, setSpeakerId] = useState("");
  const [deviceError, setDeviceError] = useState(false);
  // Stable: the preview starts again whenever this function changes, which would close the camera
  // as soon as it opens.
  const onDeviceError = useCallback(() => setDeviceError(true), []);
  const mics = useMediaDevices({ kind: "audioinput" });
  const cams = useMediaDevices({ kind: "videoinput" });
  const speakers = useMediaDevices({ kind: "audiooutput" });
  const tracks = usePreviewTracks(
    {
      audio: micOn ? { deviceId: micId || undefined } : false,
      video: camOn ? { deviceId: camId || undefined } : false,
    },
    onDeviceError,
  );
  const videoTrack = tracks?.find((t): t is LocalVideoTrack => t.kind === Track.Kind.Video);
  const audioTrack = tracks?.find((t): t is LocalAudioTrack => t.kind === Track.Kind.Audio);
  const videoRef = useRef<HTMLVideoElement>(null);
  const level = useAudioLevel(audioTrack);

  useEffect(() => {
    const element = videoRef.current;
    if (!videoTrack || !element) return;
    videoTrack.attach(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [videoTrack]);

  const start = new Date(details.startAt);
  const end = new Date(details.endAt);

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-spotlight">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <Logo className="h-5" />
          <span className="text-sm text-muted-foreground">
            Rendez-vous avec <strong className="font-medium text-foreground">{details.otherName}</strong>
          </span>
        </div>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <StatusDot tone="success" pulse />
          Salle ouverte jusqu&apos;à <span className="tabular-nums">{formatTime(new Date(details.closesAt), details.timeZone)}</span>
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-[1100px] flex-1 content-center gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-video overflow-hidden bg-stage text-stage-foreground">
            {camOn && videoTrack ? (
              <video ref={videoRef} muted playsInline className="size-full -scale-x-100 object-cover" aria-label="Aperçu de votre caméra" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3">
                <span className="flex size-20 items-center justify-center bg-stage-foreground/10 font-heading text-3xl">{initials(details.selfName)}</span>
                <span className="text-sm opacity-70">{!camOn ? "Caméra désactivée" : deviceError ? "Caméra indisponible" : "Caméra en cours d'ouverture…"}</span>
              </div>
            )}
            <span className="absolute bottom-3.5 left-3.5 bg-black/45 px-2 py-1 text-[13px]">{details.selfName}</span>
            <div className="absolute right-3.5 bottom-3.5 flex gap-2">
              <StageToggle on={micOn} label={micOn ? "Couper le micro" : "Activer le micro"} onClick={() => setMicOn(!micOn)}>
                {micOn ? <MicIcon /> : <MicOffIcon />}
              </StageToggle>
              <StageToggle on={camOn} label={camOn ? "Couper la caméra" : "Activer la caméra"} onClick={() => setCamOn(!camOn)}>
                {camOn ? <VideoIcon /> : <VideoOffIcon />}
              </StageToggle>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <span>Micro</span>
            <div className="h-1 flex-1 bg-muted" role="meter" aria-label="Niveau du micro" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
              <div className="h-full bg-success transition-[width] duration-100" style={{ width: `${Math.round(level * 100)}%` }} />
            </div>
            <span>{micOn ? (level > 0.05 ? "On vous entend" : "Parlez pour tester") : "Coupé"}</span>
          </div>
          {deviceError && (
            <p role="alert" className="text-[13px] text-destructive">
              La caméra ou le micro n&apos;est pas accessible. Vérifiez les autorisations de votre navigateur.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="eyebrow text-muted-foreground tabular-nums">
              {formatDate(start, details.timeZone)} · {formatTimeRange(start, end, details.timeZone)}
            </span>
            <h1 className="font-heading text-4xl font-medium">Prêt à entrer ?</h1>
            <p className="text-sm leading-6 text-muted-foreground">Vous pouvez entrer et attendre {details.otherName} dans la salle.</p>
          </div>
          <DeviceSelect label="Micro" devices={mics} value={micId} onChange={setMicId} />
          <DeviceSelect label="Caméra" devices={cams} value={camId} onChange={setCamId} />
          {speakers.length > 0 && <DeviceSelect label="Haut-parleur" devices={speakers} value={speakerId} onChange={setSpeakerId} />}
          {error && (
            <p role="alert" className="border-l-2 border-destructive bg-muted px-4 py-3 text-sm">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="lg" className="flex-1" disabled={entering} onClick={() => onEnter({ micOn, camOn, micId, camId, speakerId })}>
              {entering ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : null}
              Entrer dans la salle
              {!entering && <ArrowRightIcon data-icon="inline-end" />}
            </Button>
            <Button size="lg" variant="ghost" onClick={onBack}>
              Retour
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">Votre navigateur demandera l&apos;accès à la caméra et au micro.</span>
        </div>
      </main>
    </div>
  );
}

function DeviceSelect({
  label,
  devices,
  value,
  onChange,
}: {
  label: string;
  devices: MediaDeviceInfo[];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `device-${label}`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)} className="w-full">
        <NativeSelectOption value="">Par défaut</NativeSelectOption>
        {devices
          .filter((device) => device.deviceId && device.deviceId !== "default")
          .map((device, index) => (
            <NativeSelectOption key={device.deviceId} value={device.deviceId}>
              {device.label || `${label} ${index + 1}`}
            </NativeSelectOption>
          ))}
      </NativeSelect>
    </div>
  );
}

// Buttons laid on the video: red when cut.
function StageToggle({ on, label, onClick, children }: { on: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={!on}
      onClick={onClick}
      className={cn(
        "flex size-12 items-center justify-center border text-stage-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-[18px]",
        on ? "border-white/30 bg-black/35" : "border-destructive bg-destructive",
      )}
    >
      {children}
    </button>
  );
}

// The level of the microphone, from 0 to 1.
function useAudioLevel(track: LocalAudioTrack | undefined) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!track) return;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(new MediaStream([track.mediaStreamTrack]));
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let frame = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const value of data) peak = Math.max(peak, Math.abs(value - 128) / 128);
      // In steps of 5 %: the page is drawn again only when the level visibly changes.
      setLevel(Math.round(Math.min(1, peak * 2) * 20) / 20);
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      setLevel(0);
      void context.close();
    };
  }, [track]);
  return level;
}

// ——— In the room ———

function RoomView({ details }: { details: MeetingDetails }) {
  const room = useRoomContext();
  const remotes = useRemoteParticipants();
  const other = remotes[0];
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [joinedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const closesAt = new Date(details.closesAt).getTime();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // The room closes 30 minutes after the planned end: the page leaves it.
  useEffect(() => {
    if (now >= closesAt) void room.disconnect();
  }, [now, closesAt, room]);

  const remoteShare = tracks.find((t) => isTrackReference(t) && t.source === Track.Source.ScreenShare && !t.participant.isLocal);
  const localShare = tracks.find((t) => isTrackReference(t) && t.source === Track.Source.ScreenShare && t.participant.isLocal);
  const remoteCamera = tracks.find((t) => t.source === Track.Source.Camera && !t.participant.isLocal);
  const localCamera = tracks.find((t) => t.source === Track.Source.Camera && t.participant.isLocal);
  const main = remoteShare ?? remoteCamera;
  const mainShowsVideo = !!main && isTrackReference(main) && !main.publication.isMuted;
  const ownShowsVideo = !!localCamera && isTrackReference(localCamera) && !localCamera.publication.isMuted;

  const elapsed = Math.max(0, Math.floor((now - joinedAt) / 1000));
  const closing = closesAt - now <= ROOM_CLOSING_WARNING_MINUTES * 60_000;
  const start = new Date(details.startAt);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex min-w-0 items-center gap-3 text-sm">
          {/* Back to the platform: leaves the room, which can be joined again while it is open. */}
          <Button variant="ghost" size="sm" onClick={() => void room.disconnect()}>
            <ArrowLeftIcon data-icon="inline-start" />
            {details.backLabel}
          </Button>
          <Logo className="hidden h-5 shrink-0 sm:block" />
          <span className="truncate font-medium">{details.otherName}</span>
          <span className="hidden text-muted-foreground sm:inline">
            · Fin prévue à <span className="tabular-nums">{formatTime(new Date(details.endAt), details.timeZone)}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <CopyLinkButton path={details.shareLink.path} label={details.shareLink.label} />
          <span className="text-sm text-muted-foreground tabular-nums" aria-label="Temps écoulé">
            {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
          </span>
        </div>
      </header>

      {closing && (
        <div role="status" className="flex items-center gap-3 border-b border-border bg-muted px-5 py-2.5 text-sm">
          <span className="eyebrow text-warning">Attention</span>
          <span>
            La salle ferme dans <strong className="font-medium tabular-nums">{Math.max(1, Math.ceil((closesAt - now) / 60_000))} minutes</strong>, à{" "}
            <span className="tabular-nums">{formatTime(new Date(closesAt), details.timeZone)}</span>.
          </span>
        </div>
      )}

      <div className="relative flex min-h-0 flex-1">
        <div className="relative flex min-h-0 flex-1 p-3 sm:p-4">
          <div className="relative flex-1 overflow-hidden bg-stage text-stage-foreground">
            {main && mainShowsVideo && isTrackReference(main) ? (
              <>
                <VideoTrack trackRef={main} className={cn("absolute inset-0 size-full", main.source === Track.Source.ScreenShare ? "object-contain" : "object-cover")} />
                <span className="absolute bottom-3.5 left-3.5 bg-black/45 px-2 py-1 text-[13px]">{other?.name || details.otherName}</span>
              </>
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="flex size-24 items-center justify-center bg-stage-foreground/10 font-heading text-4xl">{initials(details.otherName)}</span>
                {other ? (
                  <span className="text-sm opacity-70">Caméra désactivée</span>
                ) : (
                  <>
                    <span className="font-heading text-2xl">{details.otherName} va vous rejoindre</span>
                    <span className="text-sm opacity-70">
                      Le rendez-vous commence à <span className="tabular-nums">{formatTime(start, details.timeZone)}</span>.
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="absolute right-3.5 bottom-3.5 aspect-video w-[28%] max-w-60 min-w-28 overflow-hidden border border-white/20 bg-stage">
              {ownShowsVideo && localCamera && isTrackReference(localCamera) ? (
                <VideoTrack trackRef={localCamera} className="absolute inset-0 size-full -scale-x-100 object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center font-heading text-xl">{initials(details.selfName)}</div>
              )}
              <span className="absolute bottom-1.5 left-1.5 bg-black/45 px-1.5 py-0.5 text-xs">Vous</span>
            </div>
            {localShare && (
              <span className="absolute top-3.5 left-3.5 bg-primary px-2 py-1 text-xs text-primary-foreground">Vous partagez votre écran</span>
            )}
          </div>
        </div>

        {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} timeZone={details.timeZone} selfIdentity={localParticipant.identity} />}
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-2 border-t border-border px-4 py-3">
        <ToggleControl source={Track.Source.Microphone} onLabel="Couper le micro" offLabel="Activer le micro" iconOn={<MicIcon />} iconOff={<MicOffIcon />} text="Micro" />
        <ToggleControl source={Track.Source.Camera} onLabel="Couper la caméra" offLabel="Activer la caméra" iconOn={<VideoIcon />} iconOff={<VideoOffIcon />} text="Caméra" />
        <ToggleControl
          source={Track.Source.ScreenShare}
          onLabel="Arrêter le partage"
          offLabel="Partager l'écran"
          iconOn={<MonitorUpIcon />}
          iconOff={<MonitorUpIcon />}
          text="Partager l'écran"
          className="hidden sm:inline-flex"
        />
        <Button variant={chatOpen ? "contrast" : "outline"} size="lg" aria-pressed={chatOpen} onClick={() => setChatOpen(!chatOpen)}>
          <MessageSquareIcon data-icon="inline-start" />
          Discussion
        </Button>
        <Button variant="destructive" size="lg" onClick={() => void room.disconnect()}>
          Quitter
        </Button>
      </footer>
    </>
  );
}

// Micro, camera, screen sharing: ink when on (sharing), outline otherwise; red when the micro or the
// camera is cut.
function ToggleControl({
  source,
  onLabel,
  offLabel,
  iconOn,
  iconOff,
  text,
  className,
}: {
  source: Track.Source.Microphone | Track.Source.Camera | Track.Source.ScreenShare;
  onLabel: string;
  offLabel: string;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  text: string;
  className?: string;
}) {
  const { toggle, enabled, pending } = useTrackToggle({ source });
  const isShare = source === Track.Source.ScreenShare;
  return (
    <Button
      size="lg"
      variant={isShare ? (enabled ? "contrast" : "outline") : enabled ? "outline" : "destructive"}
      aria-label={enabled ? onLabel : offLabel}
      aria-pressed={isShare ? enabled : !enabled}
      disabled={pending}
      onClick={() => void toggle()}
      className={className}
    >
      <span data-icon="inline-start">{enabled ? iconOn : iconOff}</span>
      <span className="hidden sm:inline">{text}</span>
    </Button>
  );
}

function ChatPanel({ onClose, timeZone, selfIdentity }: { onClose: () => void; timeZone: string; selfIdentity: string }) {
  const { chatMessages, send, isSending } = useChat();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chatMessages.length]);

  return (
    <aside className="absolute inset-0 z-10 flex flex-col border-l border-border bg-background sm:static sm:w-80" aria-label="Discussion">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium">Discussion</span>
        <Button variant="ghost" size="icon-sm" aria-label="Fermer la discussion" onClick={onClose}>
          <XIcon />
        </Button>
      </div>
      <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4" aria-live="polite">
        {chatMessages.length === 0 && <p className="text-[13px] text-muted-foreground">Les messages ne sont pas conservés après la visio.</p>}
        {chatMessages.map((message) => (
          <div key={message.id} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {message.from?.identity === selfIdentity ? "Vous" : message.from?.name || "Invité"} ·{" "}
              <span className="tabular-nums">{formatTime(new Date(message.timestamp), timeZone)}</span>
            </span>
            <span className="text-sm leading-5 break-words whitespace-pre-line">{message.message}</span>
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          const text = draft.trim();
          if (!text) return;
          void send(text);
          setDraft("");
        }}
      >
        <label htmlFor="chat-message" className="sr-only">
          Message
        </label>
        <input
          id="chat-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Écrire un message"
          maxLength={2000}
          className="h-10 min-w-0 flex-1 border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" size="icon-lg" variant="outline" aria-label="Envoyer" disabled={isSending || !draft.trim()}>
          <SendIcon />
        </Button>
      </form>
    </aside>
  );
}

// "Copier le lien": the guest's link, on the site where we are.
function CopyLinkButton({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}${path}`);
        } catch {
          toast.error("Le lien n'a pas pu être copié.");
          return;
        }
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
      <span className="max-sm:sr-only">{copied ? "Lien copié" : label}</span>
    </Button>
  );
}
