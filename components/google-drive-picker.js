"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

export function GoogleDrivePicker({ onSelect, disabled }) {
  const [pickerLoaded, setPickerLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadScripts = () => {
      // GIS script
      const gsiScript = document.createElement("script");
      gsiScript.src = "https://accounts.google.com/gsi/client";
      gsiScript.async = true;
      gsiScript.defer = true;
      document.body.appendChild(gsiScript);

      // GAPI script
      const gapiScript = document.createElement("script");
      gapiScript.src = "https://apis.google.com/js/api.js";
      gapiScript.onload = () => {
        window.gapi.load("client:picker", initializeApis);
      };
      document.body.appendChild(gapiScript);
    };

    const initializeApis = async () => {
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
      });

      const newTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            setAccessToken(tokenResponse.access_token);
            createPicker(tokenResponse.access_token);
          }
        },
      });

      setTokenClient(newTokenClient);
      setPickerLoaded(true);
    };

    loadScripts();
  }, []);

  const createPicker = (token) => {
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setMimeTypes('image/png,image/jpeg,image/jpg,image/gif,image/webp');

    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setCallback(pickerCallback)
      .build();

    picker.setVisible(true);
  };

  const handleClick = () => {
    setLoading(true);
    if (accessToken) {
      createPicker(accessToken);
      setLoading(false);
    } else if (tokenClient) {
      tokenClient.requestAccessToken();
    }
  };

  const pickerCallback = async (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      setLoading(true);
      const selectedItems = data.docs;
      let filesToProcess = [];

      // Process each selected item (could be files or folders)
      for (const item of selectedItems) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          // If it's a folder, fetch all image files within it
          try {
            const response = await window.gapi.client.drive.files.list({
              q: `'${item.id}' in parents and mimeType contains 'image/'`,
              fields: 'files(id, name, mimeType, thumbnailLink, size, webContentLink)',
              pageSize: 1000
            });
            
            filesToProcess = [...filesToProcess, ...response.result.files];
          } catch (error) {
            console.error('Error fetching folder contents:', error);
          }
        } else {
          // If it's a file, add it directly
          filesToProcess.push(item);
        }
      }

      const fetchedFiles = await Promise.all(
        filesToProcess.map(async (file) => {
          try {
            const res = await window.gapi.client.drive.files.get({
              fileId: file.id,
              fields: "id,name,mimeType,thumbnailLink,size,webContentLink",
            });

            return {
              id: file.id,
              name: res.result.name,
              mimeType: res.result.mimeType,
              url: res.result.webContentLink || res.result.thumbnailLink,
              sizeBytes: parseInt(res.result.size || "0", 10),
            };
          } catch (error) {
            console.error('Error fetching file details:', error);
            return null;
          }
        })
      );

      // Filter out any failed fetches
      const validFiles = fetchedFiles.filter(file => file !== null);
      onSelect(validFiles);
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleClick}
      disabled={!pickerLoaded || disabled || loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
      )}
      Selecionar desde Google Drive
    </Button>
  );
}
