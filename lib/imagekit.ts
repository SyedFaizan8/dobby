import ImageKit from "imagekit";
import { IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PUBLIC_URL_ENDPOINT } from "./constants";

const imagekit = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY,
  privateKey: IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: IMAGEKIT_PUBLIC_URL_ENDPOINT,
});

export default imagekit;
