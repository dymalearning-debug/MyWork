import { UploadsProvider } from "./_components/uploads";

// "Mes fichiers" (docs/drive.md): the uploads belong to the module, not to a folder, and go on
// from one folder to another.
export default function DriveLayout({ children }: { children: React.ReactNode }) {
  return <UploadsProvider>{children}</UploadsProvider>;
}
