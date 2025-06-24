export async function splitIntoPages(PAGE_PADDING_MM = 10) {
    const resumeContent = document.getElementById('resume-content');
    if (!resumeContent) {
        console.error('Resume content element not found');
        return;
    }

    // Wait for content to render
    const waitForContent = () => new Promise(resolve => {
        const check = () => {
            if (resumeContent.children.length > 0) {
                resolve();
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });

    await waitForContent();

    // Store current content, unwrapping .page divs
    const tempContainer = document.createElement('div');
    const pages = resumeContent.querySelectorAll('.page');
    if (pages.length > 0) {
        pages.forEach(page => {
            while (page.firstChild) {
                tempContainer.appendChild(page.firstChild);
            }
        });
    } else {
        while (resumeContent.firstChild) {
            tempContainer.appendChild(resumeContent.firstChild);
        }
    }

    resumeContent.innerHTML = ''; // Clear existing content

    // Create page div
    const createPage = () => {
        const page = document.createElement('div');
        page.classList.add('page');
        page.style.padding = `${PAGE_PADDING_MM}mm`;
        if (window.isPaginated) {
            page.classList.add('paginated'); // For aspect-ratio in CSS
        }
        return page;
    };

    // Non-paginated case: single page
    if (!window.isPaginated) {
        console.log('Rendering single page: isPaginated is false');
        const page = createPage();
        while (tempContainer.firstChild) {
            page.appendChild(tempContainer.firstChild);
        }
        resumeContent.appendChild(page);
        return;
    }

    // Paginated case: multiple pages
    console.log('Splitting into multiple pages: isPaginated is true');
    const mmToPx = (mm) => mm * 3.779; // 1mm = 3.779px at 96dpi
    const A4_HEIGHT_PX = mmToPx(297 - 2 * PAGE_PADDING_MM); // 277mm ≈ 1046.93px
    const A4_WIDTH_PX = mmToPx(210 - 2 * PAGE_PADDING_MM); // 190mm ≈ 718.11px

    // Organize content into sections and entries
    const getSectionsAndEntries = () => {
        const sections = [];
        const children = Array.from(tempContainer.children);
        let currentSection = { header: null, entries: [], currentEntry: [], name: '' };

        children.forEach((child, index) => {
            if (child.tagName === 'H1' || child.tagName === 'H2') {
                if (currentSection.header || currentSection.entries.length > 0) {
                    if (currentSection.currentEntry.length > 0) {
                        currentSection.entries.push(currentSection.currentEntry);
                        currentSection.currentEntry = [];
                    }
                    sections.push(currentSection);
                }
                currentSection = { header: child.cloneNode(true), entries: [], currentEntry: [], name: child.textContent.trim() };
            } else if (child.tagName === 'H3') {
                if (currentSection.currentEntry.length > 0) {
                    currentSection.entries.push(currentSection.currentEntry);
                    currentSection.currentEntry = [];
                }
                currentSection.currentEntry.push(child.cloneNode(true));
            } else {
                currentSection.currentEntry.push(child.cloneNode(true));
            }

            if (index === children.length - 1 && (currentSection.header || currentSection.currentEntry.length > 0)) {
                if (currentSection.currentEntry.length > 0) {
                    currentSection.entries.push(currentSection.currentEntry);
                }
                sections.push(currentSection);
            }
        });

        console.log('Sections found:', sections.length, sections.map(s => ({
            name: s.name,
            entryCount: s.entries.length
        })));
        return sections;
    };

    const createSection = () => {
        const section = document.createElement('div');
        section.classList.add('section');
        return section;
    };

    const createEntry = () => {
        const entry = document.createElement('div');
        entry.classList.add('entry');
        return entry;
    };

    // Measure height of an element
    const measureHeight = (element) => {
        const tempContainer = document.createElement('div');
        tempContainer.style.width = `${A4_WIDTH_PX}px`;
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.appendChild(element);
        resumeContent.appendChild(tempContainer);
        tempContainer.offsetHeight; // Force reflow
        const height = tempContainer.offsetHeight;
        tempContainer.remove();
        return height;
    };

    // Split an oversized entry, handling nested lists
    const splitOversizedEntry = (entry, maxHeightPx) => {
        const tempEntry = createEntry();
        tempEntry.style.width = `${A4_WIDTH_PX}px`;
        tempEntry.style.position = 'absolute';
        tempEntry.style.visibility = 'hidden';
        entry.forEach(el => tempEntry.appendChild(el.cloneNode(true)));
        resumeContent.appendChild(tempEntry);
        tempEntry.offsetHeight; // Force reflow
        const totalHeight = tempEntry.offsetHeight;
        tempEntry.remove();
        console.log(`splitOversizedEntry: Entry height=${totalHeight.toFixed(2)}px, maxHeight=${maxHeightPx.toFixed(2)}px`);

        if (totalHeight <= maxHeightPx) {
            console.log('splitOversizedEntry: No split needed');
            return [entry];
        }

        const splitEntries = [];
        let currentEntry = [];
        let currentHeight = 0;

        // Split a list into smaller lists or individual items
        const splitList = (list, maxHeight) => {
            console.log(`splitList: Starting with maxHeight=${maxHeight.toFixed(2)}px, ${list.children.length} items`);
            const items = Array.from(list.children);
            const splitResults = [];
            let currentList = document.createElement('ul');
            let listHeight = 0;

            items.forEach((item, idx) => {
                const itemClone = item.cloneNode(true);
                console.log(`splitList: Processing item ${idx + 1}: ${itemClone.textContent.trim().substring(0, 50)}...`);
                console.log(`splitList: Item ${idx + 1} before measure: ${itemClone.outerHTML.substring(0, 200)}...`);
                let itemHeight = measureHeight(itemClone);
                console.log(`splitList: Item ${idx + 1} height=${itemHeight.toFixed(2)}px`);

                // Check for nested lists
                const nestedLists = Array.from(itemClone.querySelectorAll('ul'));
                console.log(`splitList: Item ${idx + 1} has ${nestedLists.length} nested list(s)`);

                if (nestedLists.length > 0) {
                    // Store nested lists to reattach if needed
                    const originalNestedLists = nestedLists.map(nl => nl.cloneNode(true));
                    console.log(`splitList: Stored ${originalNestedLists.length} nested lists for item ${idx + 1}`);

                    let needsSplit = false;
                    for (let nIdx = 0; nIdx < nestedLists.length; nIdx++) {
                        const nestedList = nestedLists[nIdx];
                        const nestedHeight = measureHeight(nestedList);
                        console.log(`splitList: Nested list ${nIdx + 1} height=${nestedHeight.toFixed(2)}px`);
                        console.log(`splitList: Nested list ${nIdx + 1} content: ${nestedList.outerHTML.substring(0, 200)}...`);

                        if (nestedHeight > maxHeight - listHeight) {
                            console.log(`splitList: Nested list ${nIdx + 1} too large, splitting`);
                            needsSplit = true;
                            const splitNested = splitList(nestedList, maxHeight - listHeight);
                            // Preserve non-nested content
                            const nonNestedContent = Array.from(itemClone.childNodes)
                                .filter(node => node !== nestedList)
                                .map(node => node.cloneNode(true));
                            console.log(`splitList: Non-nested content for item ${idx + 1}: ${nonNestedContent.map(n => n.textContent?.trim().substring(0, 20)).join(', ')}`);

                            // Create <li> for the first split
                            const firstLi = document.createElement('li');
                            nonNestedContent.forEach(node => firstLi.appendChild(node));
                            if (splitNested.length > 0) {
                                firstLi.appendChild(splitNested[0]);
                            }
                            // Replace itemClone's content
                            itemClone.innerHTML = '';
                            firstLi.childNodes.forEach(node => itemClone.appendChild(node));
                            itemHeight = measureHeight(itemClone);
                            console.log(`splitList: Updated item ${idx + 1} height after first split=${itemHeight.toFixed(2)}px`);

                            // Create continuation <li> for remaining splits
                            const additionalItems = [];
                            splitNested.slice(1).forEach((splitNestedList, sIdx) => {
                                const continuationLi = document.createElement('li');
                                nonNestedContent.forEach(node => continuationLi.appendChild(node.cloneNode(true)));
                                continuationLi.appendChild(splitNestedList);
                                additionalItems.push(continuationLi);
                                console.log(`splitList: Added continuation item ${sIdx + 1} for nested split`);
                            });

                            // Add the updated item if it fits
                            if (listHeight + itemHeight <= maxHeight) {
                                currentList.appendChild(itemClone);
                                listHeight += itemHeight;
                                console.log(`splitList: Added updated item ${idx + 1} to current list, new listHeight=${listHeight.toFixed(2)}px`);
                            } else {
                                if (currentList.children.length > 0) {
                                    splitResults.push({ type: 'list', content: currentList });
                                    currentList = document.createElement('ul');
                                    listHeight = 0;
                                    console.log(`splitList: Pushed current list before adding updated item ${idx + 1}`);
                                }
                                currentList.appendChild(itemClone);
                                listHeight += itemHeight;
                                console.log(`splitList: Added updated item ${idx + 1} to new list, listHeight=${listHeight.toFixed(2)}px`);
                            }

                            // Add continuation items
                            additionalItems.forEach((addItem, aIdx) => {
                                const addItemHeight = measureHeight(addItem);
                                console.log(`splitList: Processing additional item ${aIdx + 1} from nested split, height=${addItemHeight.toFixed(2)}px`);
                                if (listHeight + addItemHeight <= maxHeight) {
                                    currentList.appendChild(addItem);
                                    listHeight += addItemHeight;
                                    console.log(`splitList: Added additional item ${aIdx + 1}, new listHeight=${listHeight.toFixed(2)}px`);
                                } else {
                                    if (currentList.children.length > 0) {
                                        splitResults.push({ type: 'list', content: currentList });
                                        currentList = document.createElement('ul');
                                        listHeight = 0;
                                        console.log(`splitList: Pushed list before adding additional item ${aIdx + 1}`);
                                    }
                                    currentList.appendChild(addItem);
                                    listHeight += addItemHeight;
                                    console.log(`splitList: Added additional item ${aIdx + 1} to new list, listHeight=${listHeight.toFixed(2)}px`);
                                }
                            });
                        }
                    }

                    if (!needsSplit) {
                        // Restore original nested lists to prevent loss
                        console.log(`splitList: Restoring original nested lists for item ${idx + 1}`);
                        itemClone.innerHTML = item.innerHTML; // Reset to original content
                        itemHeight = measureHeight(itemClone);
                        console.log(`splitList: Restored item ${idx + 1} height=${itemHeight.toFixed(2)}px`);
                    }
                }

                console.log(`splitList: Item ${idx + 1} after processing: ${itemClone.outerHTML.substring(0, 200)}...`);
                // Add the item to the current list if it fits
                if (listHeight + itemHeight <= maxHeight) {
                    console.log(`splitList: Adding item ${idx + 1} to current list before append: ${itemClone.outerHTML.substring(0, 200)}...`);
                    currentList.appendChild(itemClone);
                    listHeight += itemHeight;
                    console.log(`splitList: Added item ${idx + 1} to current list, new listHeight=${listHeight.toFixed(2)}px`);
                    console.log(`splitList: Current list after adding item ${idx + 1}: ${currentList.outerHTML.substring(0, 200)}...`);
                } else {
                    if (currentList.children.length > 0) {
                        console.log(`splitList: Pushing current list with ${currentList.children.length} items`);
                        splitResults.push({ type: 'list', content: currentList });
                        currentList = document.createElement('ul');
                        listHeight = 0;
                    }
                    // If the item is too large and has no nested lists
                    if (itemHeight > maxHeight && nestedLists.length === 0) {
                        console.log(`splitList: Item ${idx + 1} too large (no nested lists), splitting text`);
                        // Split text content
                        const textContent = itemClone.textContent.trim();
                        const tempLi = document.createElement('li');
                        tempLi.textContent = textContent;
                        const fullHeight = measureHeight(tempLi);
                        if (fullHeight > maxHeight) {
                            // Split text word-by-word
                            const words = textContent.split(' ');
                            let splitText = '';
                            let splitLi = document.createElement('li');
                            for (const word of words) {
                                const testLi = document.createElement('li');
                                testLi.textContent = splitText + (splitText ? ' ' : '') + word;
                                const testHeight = measureHeight(testLi);
                                if (testHeight <= maxHeight) {
                                    splitText += (splitText ? ' ' : '') + word;
                                    splitLi.textContent = splitText;
                                } else {
                                    if (splitText) {
                                        currentList.appendChild(splitLi.cloneNode(true));
                                        splitResults.push({ type: 'list', content: currentList.cloneNode(true) });
                                        currentList = document.createElement('ul');
                                        splitLi = document.createElement('li');
                                        splitText = word;
                                        splitLi.textContent = splitText;
                                        listHeight = 0;
                                        console.log(`splitList: Split text for item ${idx + 1}, new splitText="${splitText.substring(0, 20)}..."`);
                                    }
                                }
                            }
                            if (splitText) {
                                currentList.appendChild(splitLi);
                                listHeight = measureHeight(currentList);
                                console.log(`splitList: Added final split text for item ${idx + 1}, listHeight=${listHeight.toFixed(2)}px`);
                            }
                        } else {
                            currentList.appendChild(itemClone);
                            listHeight += itemHeight;
                            console.log(`splitList: Item ${idx + 1} fits after text check, listHeight=${listHeight.toFixed(2)}px`);
                        }
                    } else {
                        console.log(`splitList: Adding large item ${idx + 1} to new list, listHeight=${itemHeight.toFixed(2)}px`);
                        currentList.appendChild(itemClone);
                        listHeight += itemHeight;
                        console.log(`splitList: Current list after adding item ${idx + 1}: ${currentList.outerHTML.substring(0, 200)}...`);
                    }
                }
            });

            if (currentList.children.length > 0) {
                console.log(`splitList: Pushing final list with ${currentList.children.length} items`);
                splitResults.push({ type: 'list', content: currentList });
            }
            console.log(`splitList: Returning ${splitResults.length} split results`);
            return splitResults;
        };

        entry.forEach((el, idx) => {
            const elClone = el.cloneNode(true);
            if (el.tagName === 'UL') {
                console.log(`splitOversizedEntry: Processing UL element ${idx + 1}`);
                const splitResults = splitList(elClone, maxHeightPx - currentHeight);
                splitResults.forEach((result, i) => {
                    if (result.type === 'list') {
                        const listHeight = measureHeight(result.content);
                        console.log(`splitOversizedEntry: Split list ${i + 1} height=${listHeight.toFixed(2)}px, currentHeight=${currentHeight.toFixed(2)}px`);
                        if (currentHeight + listHeight <= maxHeightPx) {
                            currentEntry.push(result.content);
                            currentHeight += listHeight;
                            console.log(`splitOversizedEntry: Added split list ${i + 1} to current entry`);
                        } else {
                            if (currentEntry.length > 0) {
                                splitEntries.push(currentEntry);
                                currentEntry = [];
                                currentHeight = 0;
                                console.log(`splitOversizedEntry: Pushed current entry, starting new one`);
                            }
                            currentEntry.push(result.content);
                            currentHeight += listHeight;
                            console.log(`splitOversizedEntry: Added split list ${i + 1} to new entry`);
                        }
                    }
                });
            } else {
                const elHeight = measureHeight(elClone);
                console.log(`splitOversizedEntry: Processing non-UL element ${idx + 1}, height=${elHeight.toFixed(2)}px`);
                if (currentHeight + elHeight <= maxHeightPx) {
                    currentEntry.push(elClone);
                    currentHeight += elHeight;
                    console.log(`splitOversizedEntry: Added non-UL element ${idx + 1} to current entry`);
                } else {
                    if (currentEntry.length > 0) {
                        splitEntries.push(currentEntry);
                        currentEntry = [];
                        currentHeight = 0;
                        console.log(`splitOversizedEntry: Pushed current entry for non-UL element`);
                    }
                    currentEntry.push(elClone);
                    currentHeight += elHeight;
                    console.log(`splitOversizedEntry: Added non-UL element ${idx + 1} to new entry`);
                }
            }

            if (idx === entry.length - 1 && currentEntry.length > 0) {
                console.log(`splitOversizedEntry: Pushing final entry with ${currentEntry.length} elements`);
                splitEntries.push(currentEntry);
            }
        });

        console.log(`splitOversizedEntry: Returning ${splitEntries.length} split entries`);
        return splitEntries;
    };

    // Clear contentDiv completely
    resumeContent.innerHTML = '';

    //     // Add warning if any entry is split
    let hasSplitEntries = false;
    //     const warning = document.createElement('div');
    //     warning.className = 'warning';
    //     warning.innerHTML = `
    // <p><strong>Warning:</strong> Some resume entries have been split across multiple pages. This may disrupt the visual flow, making the resume harder to read, and could affect the presentation of large content sections, such as detailed work experiences or skill lists.</p>
    // `;
    //     warning.style.display = 'none';
    //     const resumePreview = document.getElementById('resume-preview');
    //     if (resumePreview) {
    //         resumePreview.prepend(warning);
    //     } else {
    //         console.error('Resume preview element not found for warning placement');
    //     }

    const sections = getSectionsAndEntries();
    if (sections.length === 0) {
        const page = createPage();
        tempContainer.childNodes.forEach(node => page.appendChild(node.cloneNode(true)));
        resumeContent.appendChild(page);
        return;
    }

    let currentPage = createPage();
    let currentHeight = 0;
    let pageNumber = 1;

    // Temporarily set unscaled dimensions for measurement
    const originalTransform = resumeContent.style.transform;
    resumeContent.style.transform = 'scale(1)';
    const originalDisplay = resumeContent.style.display;
    resumeContent.style.display = 'block';

    console.log('A4 Height:', A4_HEIGHT_PX.toFixed(4), 'px');

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        console.log(`Processing section ${i + 1}: ${section.name}, ${section.entries.length} entries`);

        // Measure section header height (if present)
        let headerHeight = 0;
        if (section.header) {
            headerHeight = measureHeight(section.header.cloneNode(true));
            console.log(`  Header height: ${headerHeight.toFixed(2)}px`);
        }

        // Measure and split entries if necessary
        const entryHeights = [];
        let allEntries = [];
        for (let j = 0; j < section.entries.length; j++) {
            const entry = section.entries[j];
            const tempEntry = createEntry();
            tempEntry.style.width = `${A4_WIDTH_PX}px`;
            tempEntry.style.position = 'absolute';
            tempEntry.style.visibility = 'hidden';
            entry.forEach(el => tempEntry.appendChild(el.cloneNode(true)));
            resumeContent.appendChild(tempEntry);
            tempEntry.offsetHeight; // Force reflow
            const entryHeight = tempEntry.offsetHeight;
            tempEntry.remove();

            if (entryHeight > A4_HEIGHT_PX - headerHeight) {
                hasSplitEntries = true;
                const splitEntries = splitOversizedEntry(entry, A4_HEIGHT_PX - headerHeight);
                splitEntries.forEach((splitEntry, idx) => {
                    allEntries.push(splitEntry);
                    // Measure height of split entry
                    const tempSplitEntry = createEntry();
                    tempSplitEntry.style.width = `${A4_WIDTH_PX}px`;
                    tempSplitEntry.style.position = 'absolute';
                    tempSplitEntry.style.visibility = 'hidden';
                    splitEntry.forEach(el => tempSplitEntry.appendChild(el.cloneNode(true)));
                    resumeContent.appendChild(tempSplitEntry);
                    tempSplitEntry.offsetHeight; // Force reflow
                    const splitEntryHeight = tempSplitEntry.offsetHeight;
                    tempSplitEntry.remove();
                    entryHeights.push(splitEntryHeight);
                    console.log(`  Split Entry ${j + 1}.${idx + 1} height: ${splitEntryHeight.toFixed(2)}px`);
                });
            } else {
                allEntries.push(entry);
                entryHeights.push(entryHeight);
                console.log(`  Entry ${j + 1} height: ${entryHeight.toFixed(2)}px`);
            }
        }

        // Calculate total section height
        const totalSectionHeight = headerHeight + entryHeights.reduce((sum, h) => sum + h, 0);
        console.log(`  Total section height: ${totalSectionHeight.toFixed(2)}px`);

        // Check remaining space
        const remainingSpace = A4_HEIGHT_PX - currentHeight;
        console.log(`  Remaining space on page ${pageNumber}: ${remainingSpace.toFixed(2)}px`);

        // Try to fit header + as many entries as possible
        let entriesToInclude = [];
        let partialHeight = headerHeight;
        let splitRequired = totalSectionHeight > A4_HEIGHT_PX || (currentHeight + totalSectionHeight > A4_HEIGHT_PX && currentPage.children.length > 0);

        if (splitRequired) {
            // Include entries that fit in remaining space
            for (let j = 0; j < allEntries.length; j++) {
                if (currentHeight + partialHeight + entryHeights[j] <= A4_HEIGHT_PX) {
                    partialHeight += entryHeights[j];
                    entriesToInclude.push(allEntries[j]);
                } else {
                    break;
                }
            }

            // If no entries fit, start a new page
            if (entriesToInclude.length === 0 && currentPage.children.length > 0) {
                console.log(`Creating new page ${pageNumber + 1} (no entries fit in ${remainingSpace.toFixed(2)}px)`);
                resumeContent.appendChild(currentPage);
                currentPage = createPage();
                currentHeight = 0;
                pageNumber++;
                partialHeight = headerHeight;
                // Recalculate with full page space
                for (let j = 0; j < allEntries.length; j++) {
                    if (partialHeight + entryHeights[j] <= A4_HEIGHT_PX) {
                        partialHeight += entryHeights[j];
                        entriesToInclude.push(allEntries[j]);
                    } else {
                        break;
                    }
                }
            }
        } else {
            entriesToInclude = allEntries;
            partialHeight = totalSectionHeight;
        }

        // Check if partial section fits, else start new page
        if (currentHeight + partialHeight > A4_HEIGHT_PX && currentPage.children.length > 0) {
            console.log(`Creating new page ${pageNumber + 1} (current height ${currentHeight.toFixed(2)}px + ${partialHeight.toFixed(2)}px > ${A4_HEIGHT_PX.toFixed(2)}px)`);
            resumeContent.appendChild(currentPage);
            currentPage = createPage();
            currentHeight = 0;
            pageNumber++;
        }

        // Add partial section
        const partialSection = createSection();
        if (section.header && !section.name.includes('(cont.)')) {
            partialSection.appendChild(section.header.cloneNode(true));
        }
        entriesToInclude.forEach(entry => {
            const entryContainer = createEntry();
            entry.forEach(el => entryContainer.appendChild(el.cloneNode(true)));
            partialSection.appendChild(entryContainer);
        });
        currentPage.appendChild(partialSection);
        currentHeight += partialHeight;
        console.log(`Added partial section "${section.name}" with ${entriesToInclude.length} entries to page ${pageNumber}, new page height: ${currentHeight.toFixed(2)}px`);

        // Create continuation section for remaining entries
        if (entriesToInclude.length < allEntries.length) {
            const remainingEntries = allEntries.slice(entriesToInclude.length);
            sections.splice(i + 1, 0, {
                header: section.header ? section.header.cloneNode(true) : null,
                entries: remainingEntries,
                name: section.name.includes('(cont.)') ? section.name : `${section.name} (cont.)`
            });
            console.log(`Created continuation section "${section.name.includes('(cont.)') ? section.name : section.name + ' (cont.)'}" with ${remainingEntries.length} entries`);
        }
    }

    // Append the last page if it has content
    if (currentPage.children.length > 0) {
        resumeContent.appendChild(currentPage);
        console.log(`Final page ${pageNumber} appended, total height: ${currentHeight.toFixed(2)}px`);
    }

    // // Show warning if entries were split
    // warning.style.display = hasSplitEntries ? 'block' : 'none';

    // Restore original styles
    resumeContent.style.transform = originalTransform;
    resumeContent.style.display = originalDisplay;
}