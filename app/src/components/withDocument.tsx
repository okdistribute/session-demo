import React, { useState, useEffect } from 'react'
import { Upwell, Draft, Author } from 'api'
import { useLocation } from 'wouter'
import Documents from '../Documents'

let documents = Documents()

type DocumentProps = {
  id: string
  author: Author
  did?: string
}

export default function withDocument(
  WrappedComponent: any,
  props: DocumentProps
) {
  return function () {
    let [root, setRoot] = useState<Draft>()
    let [, setLocation] = useLocation()
    let { id, author } = props

    useEffect(() => {
      let unmounted = false
      let upwell: Upwell
      async function render() {
        try {
          upwell = await documents.open(id)
          if (!unmounted) setRoot(upwell.rootDraft)
        } catch (err) {}

        try {
          upwell = await documents.sync(id)
        } catch (err) {
          if (!upwell) upwell = await documents.create(props.id, author)
        } finally {
          if (!upwell) throw new Error('could not create upwell')
          if (!unmounted) setRoot(upwell.rootDraft)
        }
      }

      render()
      return () => {
        unmounted = true
      }
    }, [id, author, setLocation])
    if (!root) return <div></div>

    return <WrappedComponent root={root} {...props} />
  }
}
