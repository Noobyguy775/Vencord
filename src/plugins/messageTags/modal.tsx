/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@api/Styles";
import { closeModal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { Button, Forms, React, Text, TextInput } from "@webpack/common";

import { editTag, Tag } from "./index";

const cl = classNameFactory("vc-message-tags-modal-");

export function OpenEditModal(tag: Tag) {
    const key = openModal(modalProps => (
        <EditModal
            modalProps={modalProps}
            close={() => closeModal(key)}
            tag={tag}
        />
    ));
}

function EditModal({ modalProps, close, tag }: { modalProps: ModalProps; close(): void; tag: Tag }) {
    const oldTag = { ...tag };
    const [name, setName] = React.useState(tag.name);
    const [message, setMessage] = React.useState(tag.message);

    function onSave() {
        tag.name = name;
        tag.message = message;
        close();
        editTag(tag, oldTag);
    }

    return (
        <ModalRoot {...modalProps} size={ModalSize.SMALL}>
            <ModalHeader>
                <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Editing Tag</Text>
                <ModalCloseButton onClick={close} />
            </ModalHeader>

            <form onSubmit={onSave}>
                <ModalContent className={cl("content")}>
                    <Forms.FormSection>
                        <Forms.FormTitle className={cl("header")}>Tag Name</Forms.FormTitle>
                        <TextInput
                            autoFocus
                            value={name}
                            placeholder="Tag Name"
                            onChange={(value: string) => setName(value)}
                        />
                    </Forms.FormSection>
                    <Forms.FormDivider />
                    <Forms.FormSection>
                        <Forms.FormTitle className={cl("header")}>Tag Message (content)</Forms.FormTitle>
                        <TextInput
                            value={message}
                            placeholder="Tag Message"
                            onChange={(value: string) => setMessage(value)}
                        />
                    </Forms.FormSection>
                </ModalContent>
            </form>

            <ModalFooter>
                <Button
                    color={Button.Colors.BRAND}
                    onClick={onSave}
                >
                    Save
                </Button>
                <Button
                    color={Button.Colors.TRANSPARENT}
                    look={Button.Looks.LINK}
                    onClick={close}
                >
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}
