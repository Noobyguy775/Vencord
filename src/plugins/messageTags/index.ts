/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./styles.css";

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, registerCommand, sendBotMessage, unregisterCommand } from "@api/Commands";
import { definePluginSettings } from "@api/Settings";
import { copyToClipboard } from "@utils/clipboard";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

import { OpenEditModal } from "./modal";

const EMOTE = "<:luna:1035316192220553236>";
const DATA_KEY = "MessageTags_TAGS";
const MessageTagsMarker = Symbol("MessageTags");

export interface Tag {
    name: string;
    message: string;
}

function getTags() {
    return settings.store.tagsList;
}

function getAllTags() {
    return Object.values(settings.store.tagsList).map(tag => ({
        name: tag.name,
        value: tag.name,
        label: tag.name
    }));
}

function getTag(name: string) {
    return settings.store.tagsList[name] ?? null;
}

function addTag(tag: Tag) {
    settings.store.tagsList[tag.name] = tag;
}

export function editTag(newTag: Tag, oldTag: Tag) {
    removeTag(oldTag.name);
    unregisterCommand(oldTag.name);

    addTag(newTag);
    createTagCommand(newTag);
}

function addTags(tags: Object) {
    for (const [name, message] of Object.entries(tags)) {
        addTag({ name, message });
    }
}

function removeTag(name: string) {
    delete settings.store.tagsList[name];
}

function createTagCommand(tag: Tag) {
    registerCommand({
        name: tag.name,
        description: tag.name,
        inputType: ApplicationCommandInputType.BUILT_IN_TEXT,
        execute: async (_, ctx) => {
            if (!getTag(tag.name)) {
                sendBotMessage(ctx.channel.id, {
                    content: `${EMOTE} The tag **${tag.name}** does not exist anymore! Please reload ur Discord to fix :)`
                });
                return { content: `/${tag.name}` };
            }

            if (settings.store.clyde) sendBotMessage(ctx.channel.id, {
                content: `${EMOTE} The tag **${tag.name}** has been sent!`
            });
            return { content: tag.message.replaceAll("\\n", "\n") };
        },
        [MessageTagsMarker]: true,
    }, "CustomTags");
}

const settings = definePluginSettings({
    clyde: {
        name: "Clyde message on send",
        description: "If enabled, clyde will send you an ephemeral message when a tag was used.",
        type: OptionType.BOOLEAN,
        default: true
    },
    tagsList: {
        type: OptionType.CUSTOM,
        default: {} as Record<string, Tag>,
    }
});

export default definePlugin({
    name: "MessageTags",
    description: "Allows you to save messages and to use them with a simple command.",
    authors: [Devs.Luna, Devs.Nooby],
    settings,

    async start() {
        const tags = getTags();
        for (const tagName in tags) {
            createTagCommand(tags[tagName]);
        }
    },

    commands: [
        {
            name: "tags",
            description: "Manage all the tags for yourself",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    name: "create",
                    description: "Create a new tag",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "tag-name",
                            description: "The name of the tag to trigger the response",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        },
                        {
                            name: "message",
                            description: "The message that you will send when using this tag",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        }
                    ]
                },
                {
                    name: "list",
                    description: "List all tags from yourself",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: []
                },
                {
                    name: "delete",
                    description: "Remove a tag from your yourself",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "tag-name",
                            description: "The name of the tag to trigger the response",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        }
                    ]
                },
                {
                    name: "preview",
                    description: "Preview a tag without sending it publicly",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "tag-name",
                            description: "The name of the tag to trigger the response",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        }
                    ]
                },
                {
                    name: "export",
                    description: "Export your tags to your clipboard",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "export-one",
                            description: "Export a specific tag",
                            type: ApplicationCommandOptionType.STRING,
                            required: false
                        },
                        {
                            name: "export-all",
                            description: "Export all tags",
                            type: ApplicationCommandOptionType.BOOLEAN,
                            required: false
                        }
                    ]
                },
                {
                    name: "import",
                    description: "Import tags from your clipboard",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "string",
                            description: "Tag data to import",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        }
                    ]
                },
                {
                    name: "edit",
                    description: "Edit an existing tag",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [{
                        name: "tag-name",
                        description: "The name of the tag to edit",
                        type: ApplicationCommandOptionType.STRING,
                        required: true,
                        choices: getAllTags()
                    }]
                }
            ],

            async execute(args, ctx) {
                switch (args[0].name) {
                    case "create": {
                        const name = findOption<string>(args[0].options, "tag-name", "");
                        const message = findOption<string>(args[0].options, "message", "");

                        if (getTag(name))
                            return sendBotMessage(ctx.channel.id, {
                                content: `${EMOTE} A Tag with the name **${name}** already exists!`
                            });

                        const tag = {
                            name: name,
                            message: message
                        };

                        createTagCommand(tag);
                        addTag(tag);

                        sendBotMessage(ctx.channel.id, {
                            content: `${EMOTE} Successfully created the tag **${name}**!`
                        });
                        break; // end 'create'
                    }
                    case "delete": {
                        const name = findOption<string>(args[0].options, "tag-name", "");

                        if (!getTag(name))
                            return sendBotMessage(ctx.channel.id, {
                                content: `${EMOTE} A Tag with the name **${name}** does not exist!`
                            });

                        unregisterCommand(name);
                        removeTag(name);

                        sendBotMessage(ctx.channel.id, {
                            content: `${EMOTE} Successfully deleted the tag **${name}**!`
                        });
                        break; // end 'delete'
                    }
                    case "list": {
                        sendBotMessage(ctx.channel.id, {
                            embeds: [
                                {
                                    title: "All Tags:",
                                    description: Object.values(getTags())
                                        .map(tag => `\`${tag.name}\`: ${tag.message.slice(0, 72).replaceAll("\\n", " ")}${tag.message.length > 72 ? "..." : ""}`)
                                        .join("\n") || `${EMOTE} Woops! There are no tags yet, use \`/tags create\` to create one!`,
                                    // @ts-expect-error
                                    color: 0xd77f7f,
                                    type: "rich",
                                }
                            ]
                        });
                        break; // end 'list'
                    }
                    case "preview": {
                        const name = findOption<string>(args[0].options, "tag-name", "");
                        const tag = getTag(name);

                        if (!tag)
                            return sendBotMessage(ctx.channel.id, {
                                content: `${EMOTE} A Tag with the name **${name}** does not exist!`
                            });

                        sendBotMessage(ctx.channel.id, {
                            content: tag.message.replaceAll("\\n", "\n")
                        });
                        break; // end 'preview'
                    }
                    case "export": {
                        const exportOne = findOption<string>(args[0].options, "export-one", "");
                        const exportAll = findOption<boolean>(args[0].options, "export-all", false);

                        if (!(exportOne || exportAll)) {
                            return sendBotMessage(ctx.channel.id, {
                                content: `${EMOTE} Please specify either \`export-one\` or \`export-all\`!`
                            });
                        }

                        const exportData: Object = {};
                        if (exportOne) {
                            const tag = getTag(exportOne);
                            if (!tag) {
                                return sendBotMessage(ctx.channel.id, {
                                    content: `${EMOTE} A Tag with the name **${exportOne}** does not exist!`
                                });
                            }
                            exportData[exportOne] = tag.message;
                        } else {
                            for (const tagName in getTags()) {
                                exportData[tagName] = getTag(tagName).message;
                            }
                        }

                        let exported = "";

                        if (exportOne) {
                            exported = JSON.stringify({ [exportOne]: exportData[exportOne] }, null, 2);
                        } else {
                            exported = JSON.stringify(exportData, null, 2);
                        }

                        copyToClipboard(exported);
                        sendBotMessage(ctx.channel.id, {
                            content: `${EMOTE} Successfully copied the tag data to your clipboard!\nYou can also find it below.\`\`\`json\n${exported}\`\`\``
                        });
                        break; // end 'export'
                    }
                    case "import": {
                        const importString = findOption<string>(args[0].options, "string", "");

                        let importData: {};
                        try {
                            importData = JSON.parse(importString.trim());
                        } catch {
                            return sendBotMessage(ctx.channel.id, {
                                content: `${EMOTE} Failed to parse import string! Make sure you copied it all`
                            });
                        }

                        addTags(importData);

                        sendBotMessage(ctx.channel.id, {
                            content: `${EMOTE} Successfully imported tags!`
                        });
                        break; // end 'import'
                    }
                    case "edit": {
                        const name = findOption<string>(args[0].options, "tag-name", "");
                        const tag = getTag(name);

                        const oldtag = tag;

                        if (!tag) {
                            return sendBotMessage(ctx.channel.id, {
                                content: `${EMOTE} A Tag with the name **${name}** does not exist!`
                            });
                        }

                        OpenEditModal(tag);
                        break; // end 'edit'
                    }
                    default: {
                        sendBotMessage(ctx.channel.id, {
                            content: "Invalid sub-command"
                        });
                        break;
                    }
                }
            }
        }
    ]
});
