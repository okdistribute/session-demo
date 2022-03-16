import { AuthorId } from './Upwell';
import { Collection } from './db';

export type CommentId = string
export enum CommentState {
  OPEN, 
  CLOSED,
  CHILD
}

export type Comment = {
  id: CommentId
  author: AuthorId
  message: string
  children: string[]
  state: CommentState
}

export class Comments extends Collection<Comment> {
    addChild(parent: Comment, child: Comment) {
      this.insert(child)
      let path = `/${this.name}/${parent.id}/children`
      let len = this.doc.length(path)
      this.doc.insert(path, len, child.id)
    }
  
  }
  