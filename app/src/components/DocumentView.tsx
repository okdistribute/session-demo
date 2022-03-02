/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react/macro";
import React, { useCallback, useEffect } from "react";
import { Upwell, Author, Layer, UNKNOWN_AUTHOR } from "api";
import ListDocuments, { ButtonTab, InfoTab, AuthorColorsType } from "./ListDocuments";
import * as Documents from "../Documents";
import { EditReviewView } from "./EditReview";
//@ts-ignore
import debounce from "lodash.debounce";
import Input from "./Input";
import deterministicColor from "../color";

type DocumentViewProps = {
  id: string;
  author: Author;
};

const AUTOSAVE_INTERVAL = 1000; //ms

export default function MaybeDocument(props: DocumentViewProps) {
  let [layers, setLayers] = React.useState<Layer[]>([]);
  let [root, setRoot] = React.useState<Layer>();
  let [authorColors, setAuthorColors] = React.useState<AuthorColorsType>({});

  const render = useCallback(
    (upwell: Upwell) => {
      let layers = upwell.layers();
      let root = upwell.rootLayer();
      setRoot(root);
      setLayers(layers.filter((l) => l.id !== root.id));

      // find the authors
      const newAuthorColors = { ...authorColors };
      let changed = false;
      layers.forEach((l) => {
        if (
          l.author !== UNKNOWN_AUTHOR &&
          authorColors[l.author] === undefined
        ) {
          newAuthorColors[l.author] = "";
          changed = true;
        }
      });
      if (changed) {
        setAuthorColors((prevState) => {
          return { ...prevState, ...newAuthorColors };
        });
      }
    },
    [setRoot, setLayers, authorColors, setAuthorColors]
  );

  useEffect(() => {
    async function get() {
      let upwell;
      try {
        upwell = await Documents.open(props.id);
      } catch (err) {
        upwell = null;
      }

      try {
        if (!upwell) upwell = await Documents.sync(props.id);
        render(upwell);
      } catch (err) {
        let upwell = await Documents.create(props.id);
        render(upwell);
      }
    }

    get();
  }, [render, props.id]);

  useEffect(() => {
    function assignColor() {
      const newAuthorColors = { ...authorColors };
      let changed = false;

      for (const [authorID, authorColor] of Object.entries(authorColors)) {
        if (!authorColor) {
          newAuthorColors[authorID] = deterministicColor(authorID);
          changed = true;
        }
      }

      if (changed) {
        setAuthorColors((prevState) => {
          return { ...prevState, ...newAuthorColors };
        });
      }
    }
    assignColor()
  }, [authorColors, setAuthorColors]);

  function onChangeMade() {
    Documents.save(props.id);
    let upwell = Documents.get(props.id);
    render(upwell);
    Documents.sync(props.id)
      .then((upwell) => {
        render(upwell);
      })
      .catch((err) => {
        console.error("failed to sync", err);
      });
  }

  if (!root) return <div>Loading..</div>;
  return (
    <DocumentView
      id={props.id}
      layers={layers}
      onChangeMade={onChangeMade}
      root={root}
      author={props.author}
      authorColors={authorColors}
    />
  );
}

export function DocumentView(props: {
  id: string;
  layers: Layer[];
  root?: Layer;
  author: Author;
  authorColors: AuthorColorsType;
  onChangeMade: Function;
}) {
  const { id, root, layers, author, onChangeMade, authorColors } = props;
  let [visible, setVisible] = React.useState<Layer[]>(
    layers.length ? layers.slice(0, 1) : []
  );

  let onArchiveClick = () => {
    setVisible([]);
    return; // reset visible layers
  };

  let onLayerClick = (layer: Layer) => {
    let exists = visible.findIndex((l) => l.id === layer.id);
    if (exists > -1) {
      setVisible(visible.filter((l) => l.id !== layer.id));
    } else {
      setVisible(visible.concat([layer]));
    }
  };

  const handleFileNameInputBlur = (
    e: React.FocusEvent<HTMLInputElement, Element>,
    l: Layer
  ) => {
    let upwell = Documents.get(id);
    l.message = e.target.value;
    upwell.set(l.id, l);
    onChangeMade();
  };

  let onTextChange = debounce(async (layer: Layer) => {
    // this is saving every time text changes, do we want this??????
    onChangeMade();
  }, AUTOSAVE_INTERVAL);

  let onCreateLayer = async () => {
    let message = "";
    // always forking from root layer (for now)
    let upwell = Documents.get(id);
    let root = upwell.rootLayer();
    let newLayer = root.fork(message, author);
    upwell.add(newLayer);
    onChangeMade();
  };

  let handleShareClick = (l: Layer) => {
    let upwell = Documents.get(id);
    upwell.share(l.id);
    onChangeMade();
  };

  const handleDeleteClick = (l: Layer) => {
    let upwell = Documents.get(id);
    upwell.archive(l.id);

    // also remove from visible list
    const newVisible = visible.filter((layer: Layer) => l.id !== layer.id);
    setVisible(newVisible);

    onChangeMade();
  };

  let getEditableLayer = () => {
    if (visible.length === 1) return visible[0];
    else return undefined;
  };

  let mergeVisible = async () => {
    if (!root) return console.error("no root race condition");
    let upwell = Documents.get(id);
    let merged = visible.reduce((prev: Layer, cur: Layer) => {
      if (cur.id !== root?.id) {
        upwell.archive(cur.id);
        upwell.share(cur.id);
      }
      return Layer.merge(prev, cur);
    }, root);
    upwell.add(merged);
    onChangeMade();
    setVisible([]);
  };
  let sharedLayers = layers.filter(
    (l: Layer) => !l.archived && l.shared && l.id !== root?.id
  );

  if (!root) return <div>Loading...</div>;
  return (
    <div
      id="folio"
      css={css`
        height: 100vh;
        display: flex;
        flex-direction: row;
        padding: 30px;
        background: url("/wood.png");
      `}
    >
      <div
        id="writing-zone"
        css={css`
          flex: 1 0 auto;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
          padding: 20px 40px 40px;
          border-radius: 10px;
          display: flex;
          flex-direction: row;
          position: relative;
        `}
      >
        <EditReviewView
          onChange={onTextChange}
          visible={visible}
          author={author}
          root={root}
        ></EditReviewView>
        <div
          id="right-side"
          css={css`
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            margin-left: -1px;
          `}
        >
          <div id="private" css={css``}>
            <InfoTab css={css``} title="Layers area">
              🌱 local
            </InfoTab>
            <ButtonTab onClick={onCreateLayer} title="new layer">
              ➕
            </ButtonTab>
            <ListDocuments
              isBottom
              id={id}
              onLayerClick={onLayerClick}
              visible={visible}
              layers={layers.filter(
                (l: Layer) => l.archived && l.id !== root?.id
              )}
              onInputBlur={handleFileNameInputBlur}
            />
          </div>
        </div>
        <div
          id="bottom-bar"
          css={css`
            position: absolute;
            bottom: -14px;
            left: 0;
            width: 100%;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding: 4px 38px;
          `}
        >
          <div
            css={css`
              color: white;
            `}
          >
            Your name is{` `}
            <Input
              readOnly
              css={css`
                font-size: 16px;
                cursor: not-allowed;
                color: white;
                box-shadow: 0px -9px 0px 0px ${authorColors[author] || "none"} inset;
              `}
              value={author}
            />
          </div>
          <Button onClick={mergeVisible}>Merge visible</Button>
        </div>
      </div>
    </div>
  );
}

type ButtonType = React.ClassAttributes<HTMLButtonElement> &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

function Button(props: ButtonType) {
  return (
    <button
      css={css`
        padding: 3px 14px;
        font-size: 14px;
        border-radius: 3px;
        border: none;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        background: white;
        color: black;
        &:hover {
          background: #d1eaff;
        }
        &:disabled {
          opacity: 70%;
          cursor: not-allowed;
          filter: grayscale(40%) brightness(90%);
        }
      `}
      {...props}
    />
  );
}

/*
  async function open(): Promise<Uint8Array> {
    let [fileHandle] = await showOpenFilePicker();
    const file = await fileHandle.getFile();
    return new Uint8Array(await file.arrayBuffer());
  }

  let onOpenClick = async () => {
    let binary: Uint8Array = await open();
    // this is a hack for demos as of December 21, we probably want to do something
    // totally different
    let layer = Layer.load(binary);
    await upwell.add(layer);
    window.location.href = "/layer/" + layer.id;
  };

  let onDownloadClick = async () => {
    let filename = layer.title + ".up";
    let el = window.document.createElement("a");
    let buf: Uint8Array = layer.save();
    el.setAttribute(
      "href",
      "data:application/octet-stream;base64," + buf.toString()
    );
    el.setAttribute("download", filename);
    el.click();
  };

  let onSyncClick = async () => {
    try {
      setStatus(SYNC_STATE.LOADING);
      await upwell.syncWithServer(layer);
      setState({ title: layer.title, text: layer.text });
      setStatus(SYNC_STATE.SYNCED);
    } catch (err) {
      setStatus(SYNC_STATE.OFFLINE);
    }
  };
  */
