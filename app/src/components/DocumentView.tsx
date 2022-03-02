/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react/macro";
import React, { useCallback, useEffect } from "react";
import { Upwell, Author, Layer, UNKNOWN_AUTHOR } from "api";
import ListDocuments, { ButtonTab, AuthorColorsType } from "./ListDocuments";
import Documents from "../Documents";
import { EditReviewView } from "./EditReview";
//@ts-ignore
import debounce from "lodash.debounce";
import Input from "./Input";
import deterministicColor from "../color";

let documents = Documents()

type DocumentViewProps = {
  id: string;
  author: Author;
};

const AUTOSAVE_INTERVAL = 1000; //ms

export default function MaybeDocument(props: DocumentViewProps) {
  let [rootId, setRootId] = React.useState<string>();
  let [authorColors, setAuthorColors] = React.useState<AuthorColorsType>({});

  const render = useCallback(
    (upwell: Upwell) => {
      console.log('rendering', upwell.id)
      let root = upwell.rootLayer();
      setRootId(root.id);
      
      // find the authors
      const layers = upwell.layers();
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
    [setRootId, authorColors, setAuthorColors]
  );

  useEffect(() => {
    async function get() {
      let upwell;
      try {
        upwell = await documents.open(props.id);
      } catch (err) {
        upwell = null;
      }

      try {
        if (!upwell) upwell = await documents.sync(props.id);
        render(upwell);
      } catch (err) {
        let upwell = await documents.create(props.id);
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

  if (!rootId) return <div>Loading..</div>;
  return (
    <DocumentView
      id={props.id}
      rootId={rootId}
      author={props.author}
      authorColors={authorColors}
    />
  );
}

export function DocumentView(props: {
  id: string;
  rootId: string;
  author: Author;
  authorColors: AuthorColorsType;
}) {
  const { id, author, authorColors } = props;
  let [visible, setVisible] = React.useState<string[]>([]);
  let [rootId, setRootId] = React.useState<string>(props.rootId);


  function render(upwell: Upwell) {
    console.log('rendering', upwell.id)
    let root = upwell.rootLayer();
    setRootId(root.id);
  }

  function onChangeMade() {
    documents.save(props.id);
    let upwell = documents.get(props.id);
    render(upwell);
    documents.sync(props.id)
      .then((upwell) => {
        render(upwell);
      })
      .catch((err) => {
        console.error("failed to sync", err);
      });
  }

  let onArchiveClick = () => {
    setVisible([]);
    return; // reset visible layers
  };

  let onLayerClick = (layer: Layer) => {
    let exists = visible.findIndex((id) => id === layer.id);
    if (exists > -1) {
      setVisible(visible.filter((id) => id !== layer.id));
    } else {
      setVisible(visible.concat([layer.id]));
    }
  };

  const handleFileNameInputBlur = (
    e: React.FocusEvent<HTMLInputElement, Element>,
    l: Layer
  ) => {
    let upwell = documents.get(id);
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
    let upwell = documents.get(id);
    let root = upwell.rootLayer();
    let newLayer = root.fork(message, author);
    upwell.add(newLayer);
    onChangeMade();
  };

  let handleShareClick = (l: Layer) => {
    let upwell = documents.get(id);
    upwell.share(l.id);
    onChangeMade();
  };

  const handleDeleteClick = (l: Layer) => {
    let upwell = documents.get(id);
    upwell.archive(l.id);

    // also remove from visible list
    const newVisible = visible.filter((id: string) => l.id !== id);
    setVisible(newVisible);

    onChangeMade();
  };

  let getEditableLayer = () => {
    if (visible.length === 1) return visible[0];
    else return undefined;
  };

  let mergeVisible = async () => {
    if (!rootId) return console.error("no root race condition");
    let upwell = documents.get(id);
    let merged = visible.reduce((prev: Layer, cur: string) => {

      if (cur !== rootId) {
        upwell.archive(cur);
        upwell.share(cur);
      }
      let cur_layer = upwell.get(cur)
      prev.merge(cur_layer);
      return prev
    }, upwell.rootLayer());
    upwell.add(merged);
    onChangeMade();
    setVisible([]);
  };


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
          id={id}
          onChange={onTextChange}
          visible={visible}
          author={author}
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
          <ButtonTab onClick={onCreateLayer} title="new layer">
            ➕
          </ButtonTab>
            <ListDocuments
              id={id}
              isBottom
              colors={authorColors}
              onLayerClick={onLayerClick}
              visible={visible}
              handleShareClick={handleShareClick}
              handleDeleteClick={handleDeleteClick}
              onInputBlur={handleFileNameInputBlur}
              editableLayer={getEditableLayer()}
            />
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
