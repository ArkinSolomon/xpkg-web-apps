/*
 * Copyright (c) 2024. Arkin Solomon.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied limitations under the License.
 */

/**
 * The data used to render a single modal.
 * 
 * @typedef {Object} ModalProps
 * @property {string} title The title of the modal.
 * @property {ReactNode} children The content of the modal.
 * @property {Object[]} [buttons] The buttons that the modal has.
 * @property {string} buttons.text The text to display on the button.
 * @property {() => ModalProps} [buttons.action] The action the button should performed when clicked (automatically closes the button).
 * @property {'primary' | 'secondary'} [buttons.style=secondary] The style of the button.
 * @property {boolean} [autoFocus=false] True for the button to autofocus.
 */
export type ModalProps = {
  title: string;
  children: ReactNode | ReactNode[];
  buttons?: {
    text: string;
    action?: () => void;
    style?: 'primary' | 'secondary';
    autoFocus?: boolean;
  }[];
};

import { JSX, ReactNode, useEffect } from 'react';
import '../css/Modal.scss';
import '../css/buttons.scss';
import { identifiers } from '@xpkg/auth-util';

export default function Modal(props: ModalProps): JSX.Element {
  const buttons: JSX.Element[] = [];

  useEffect(() => {
    (document.getElementById('modal') as HTMLDialogElement).showModal();
  }, []);

  for (const button of props.buttons ?? []) 
    buttons.push(<button className={ (button.style ?? 'secondary') + '-button' } onClick={() => {
      if (button.action) 
        button.action();
      
    }} key={identifiers.alphanumericNanoid(5)}
    >
      {button.text}
    </button>);

  // Note that we don't allow the dialog to close, we just delete it when we don't need it
  return (
    <dialog id='modal' onClose={e => e.preventDefault()} aria-modal>
      <h3 id='modal-title'>{props.title}</h3>
      <div id='modal-content'>
        {props.children}
      </div>
      <div id='modal-buttons'>
        {buttons}
      </div>
    </dialog>
  );
}