export default async function ({ event }) {
    const { api } = global;
    const { threadID, author, logMessageData } = event;
    const { Threads, Users } = global.controllers;
    const getThread = (await Threads.get(threadID)) || {};
    const getThreadData = getThread.data || {};
    const getThreadInfo = getThread.info || {};

    // Default settings for threads
    const defaultColor = "195296273246380";
    const defaultEmoji = "🧋";
    const threadsToApplyDefaults = [
        "7109055135875814",
        "7905899339426702",
        "7188533334598873",
        "25540725785525846",
        "26605074275750715"
    ];

    let alertMsg = null,
        reversed = true;

    if (Object.keys(getThreadInfo).length === 0) return;

    switch (event.logMessageType) {
        case "log:thread-name":
            {
                const oldName = getThreadInfo.name || null;
                const newName = logMessageData.name;
                let smallCheck = false;

                if (getThreadData.antiSettings?.antiChangeGroupName === true) {
                    const isBot = author === botID;
                    const isReversing = global.data.temps.some(
                        (i) =>
                            i.type === "antiChangeGroupName" &&
                            i.threadID === threadID
                    );

                    if (!(isBot && isReversing)) {
                        global.data.temps.push({
                            type: "antiChangeGroupName",
                            threadID: threadID,
                        });
                        await new Promise((resolve) => {
                            api.setTitle(oldName, threadID, (err) => {
                                if (!err) reversed = true;
                                global.data.temps.splice(
                                    global.data.temps.indexOf({
                                        type: "antiChangeGroupName",
                                        threadID: threadID,
                                    }),
                                    1
                                );

                                resolve();
                            });
                        });
                    } else if (isBot) {
                        smallCheck = true;
                    }
                } else {
                    await Threads.updateInfo(threadID, { name: newName });
                }

                if (!smallCheck && reversed && getThreadData?.antiSettings?.notifyChange === true)
                    api.sendMessage(
                        getLang("plugins.events.thread-update.name.reversed_t"),
                        threadID
                    );

                if (!smallCheck && getThreadData?.notifyChange?.status === true) {
                    const authorName = (await Users.getInfo(author))?.name || author;
                    alertMsg = getLang("plugins.events.thread-update.name.changed", {
                        authorName: authorName,
                        authorId: author,
                        newName: newName,
                    });
                    if (reversed) {
                        alertMsg += getLang("plugins.events.thread-update.name.reversed");
                    }
                }
            }
            break;

        case "log:thread-color":
            {
                const oldColor = getThreadInfo.color;

                if (getThreadData.antiSettings?.antiChangeColor === true) {
                    const isBot = author === botID;
                    const isReversing = global.data.temps.some(
                        (i) =>
                            i.type === "antiChangeColor" &&
                            i.threadID === threadID
                    );

                    if (!(isBot && isReversing)) {
                        global.data.temps.push({
                            type: "antiChangeColor",
                            threadID: threadID,
                        });
                        await new Promise((resolve) => {
                            api.setColor(oldColor, threadID, (err) => {
                                if (!err) reversed = true;
                                global.data.temps.splice(
                                    global.data.temps.indexOf({
                                        type: "antiChangeColor",
                                        threadID: threadID,
                                    }),
                                    1
                                );

                                resolve();
                            });
                        });
                    }
                } else {
                    const newColor = threadsToApplyDefaults.includes(threadID)
                        ? defaultColor
                        : logMessageData.thread_color.slice(2);
                    await Threads.updateInfo(threadID, { color: newColor });
                }

                if (getThreadData?.notifyChange?.status === true && !smallCheck) {
                    const authorName = (await Users.getInfo(author))?.name || author;
                    alertMsg = getLang("plugins.events.thread-update.color.changed", {
                        authorName: authorName,
                        authorId: author,
                        oldColor: oldColor,
                        newColor: threadsToApplyDefaults.includes(threadID)
                            ? defaultColor
                            : logMessageData.thread_color.slice(2),
                    });
                }
            }
            break;

        case "log:thread-icon":
            {
                const oldEmoji = getThreadInfo.emoji;

                if (getThreadData.antiSettings?.antiChangeEmoji === true) {
                    const isBot = author === botID;
                    const isReversing = global.data.temps.some(
                        (i) =>
                            i.type === "antiChangeEmoji" &&
                            i.threadID === threadID
                    );

                    if (!(isBot && isReversing)) {
                        global.data.temps.push({
                            type: "antiChangeEmoji",
                            threadID: threadID,
                        });
                        await new Promise((resolve) => {
                            api.setEmoji(oldEmoji, threadID, (err) => {
                                if (!err) reversed = true;
                                global.data.temps.splice(
                                    global.data.temps.indexOf({
                                        type: "antiChangeEmoji",
                                        threadID: threadID,
                                    }),
                                    1
                                );

                                resolve();
                            });
                        });
                    }
                } else {
                    const newEmoji = threadsToApplyDefaults.includes(threadID)
                        ? defaultEmoji
                        : logMessageData.thread_icon;
                    await Threads.updateInfo(threadID, { emoji: newEmoji });
                }

                if (getThreadData?.notifyChange?.status === true && !smallCheck) {
                    const authorName = (await Users.getInfo(author))?.name || author;
                    alertMsg = getLang("plugins.events.thread-update.emoji.changed", {
                        authorName: authorName,
                        authorId: author,
                        oldEmoji: oldEmoji,
                        newEmoji: threadsToApplyDefaults.includes(threadID)
                            ? defaultEmoji
                            : logMessageData.thread_icon,
                    });
                }
            }
            break;

        case "log:thread-approval-mode":
            {
                getThreadInfo.approvalMode = logMessageData.APPROVAL_MODE == 0 ? false : true;

                await Threads.updateInfo(threadID, {
                    approvalMode: getThreadInfo.approvalMode,
                });
                if (getThreadData?.notifyChange?.status === true) {
                    const authorName = (await Users.getInfo(author))?.name || author;
                    alertMsg = getLang("plugins.events.thread-update.approvalMode.changed", {
                        authorName: authorName,
                        authorId: author,
                        newApprovalMode: getThreadInfo.approvalMode,
                    });
                }
            }
            break;

        case "log:thread-admins":
            {
                const adminIDs = getThreadInfo.adminIDs || [];
                const targetID = logMessageData.TARGET_ID;

                const typeofEvent = logMessageData.ADMIN_EVENT;

                if (typeofEvent == "remove_admin") {
                    const indexOfTarget = adminIDs.indexOf(targetID);
                    if (indexOfTarget > -1) {
                        adminIDs.splice(indexOfTarget, 1);
                    }
                } else {
                    adminIDs.push(targetID);
                }

                await Threads.updateInfo(threadID, { adminIDs: adminIDs });

                if (getThreadData?.notifyChange?.status === true) {
                    const authorName = (await Users.getInfo(author))?.name || author;
                    const targetName = (await Users.getInfo(targetID))?.name || targetID;

                    alertMsg = getLang(
                        `plugins.events.thread-update.admins.${
                            typeofEvent == "remove_admin" ? "removed" : "added"
                        }`,
                        {
                            authorName: authorName,
                            authorId: author,
                            targetName: targetName,
                            targetId: targetID,
                        }
                    );
                }
            }
            break;

        default:
            break;
    }

    if (alertMsg) {
        for (const rUID of getThreadData.notifyChange.registered) {
            await global.utils.sleep(300);
            api.sendMessage(alertMsg, rUID);
        }
    }

    return;
}