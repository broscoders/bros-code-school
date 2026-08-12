declare module "streamifier" {
  import { Readable } from "stream";

  function createReadStream(
    buffer: Buffer | string,
    options?: Record<string, unknown>
  ): Readable;

  const streamifier: {
    createReadStream: typeof createReadStream;
  };

  export default streamifier;
}
