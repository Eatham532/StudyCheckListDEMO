import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import * as cheerio from 'cheerio';
import type { ProgressDocument, Topic, SubTopic, ContentSection, ProgressItem } from './types';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function parseSyllabusFromHtml(html: string): ProgressDocument {
  console.log("Parsing syllabus HTML...");
  const $ = cheerio.load(html, { xmlMode: false }); // parse as HTML, not XML
  let topics: Topic[] = [];

  $('h2').each((_, h2) => {
    const h2Text = $(h2).text().replace(/^Topic:\s*/i, '').trim();
    // Only process h2s that start with 'Topic:'
    if (!/^Topic:/i.test($(h2).text())) return;
    if (!h2Text) return;
    const topicId = slugify(h2Text);

    // Always create a new topic, merge later
    const topic: Topic = {
      id: topicId,
      title: h2Text,
      subTopics: []
    };

    // Find the first h3 with text 'Subtopics'
    let ptr = $(h2).next();
    // @ts-ignore
    let foundSubtopics = false;
    let subtopicCodes: { code: string, title: string }[] = [];
    while (ptr.length && !ptr.is('h2')) {
      if (ptr.is('h3') && ptr.text().trim().toLowerCase() === 'subtopics') {
        foundSubtopics = true;
        ptr = ptr.next();
        // Collect all <p> until next heading
        while (ptr.length && !ptr.is('h3') && !ptr.is('h2')) {
          if (ptr.is('p')) {
            // Split by linebreaks or semicolons
            const lines = ptr.html()?.split(/<br\s*\/?>|;/i) || [];
            for (const line of lines) {
              const text = cheerio.load('<div>' + line + '</div>')('div').text().replace(/^([A-Z\-]+\d+):\s*/, '$1 ').replace(/:$/, '').trim();              console.log(text)
              if (!text) continue;
              // Try to extract code and title
              const match = text.match(/^([A-Z\-]+\d+)\s+(.+)$/);
              if (match) {
                subtopicCodes.push({ code: match[1], title: match[2] });
              } else {
                subtopicCodes.push({ code: text, title: '' });
              }
            }
          }
          ptr = ptr.next();
        }
        break;
      }
      ptr = ptr.next();
    }

    console.log(subtopicCodes.length);

    // For each subtopic code, find its h3 and parse content
    for (const { code, title } of subtopicCodes) {
      // Find the <h3> whose text starts with the code
      let subH3 = $(h2).nextAll('h3').filter((_, el) => $(el).text().trim().startsWith(code)).first();
      if (!subH3.length) continue;
      const subTopic: SubTopic = {
        code,
        title: title || subH3.text().replace(code, '').trim(),
        contentSections: []
      };
      // Find the next h3 with text 'Content' after this subH3
      let contentH3 = subH3.nextAll('h3').filter((_, el) => $(el).text().trim().toLowerCase() === 'content').first();
      if (!contentH3.length) continue;
      // Find the next subH3 or h2 after contentH3 to limit the region
      let nextBoundary = contentH3.nextAll('h3,h2').first();
      // Get all elements between contentH3 and nextBoundary
      let region = [];
      let ptr2 = contentH3.next();
      while (ptr2.length && (!nextBoundary.length || !ptr2.is(nextBoundary))) {
        region.push(ptr2);
        ptr2 = ptr2.next();
      }
      // Find all paragraphs with 'Students:' text in this region
      let studentParagraphs = region.filter(el => el.is('p') && el.text().toLowerCase().includes('students:'));
      for (const $studentP of studentParagraphs) {
        console.log("Processing student paragraph:", $studentP.text().trim());
        // Get the previous element in the region
        const idx = region.findIndex(e => e[0] === $studentP[0]);
        const previousElement = idx > 0 ? region[idx - 1] : cheerio.load('<div></div>')('div');
        let sectionId, sectionTitle;
        if (previousElement.is('p') && previousElement.find('strong').length > 0) {
          const strongText = previousElement.find('strong').text().trim();
          const match = strongText.match(/^([A-Z]\d+\.\d+):\s*(.+)$/);
          if (match) {
            sectionId = match[1];
            sectionTitle = match[2];
          } else {
            sectionTitle = strongText;
            sectionId = code + '.1';
          }
        } else {
          sectionId = `${code.split('-')[1] || code}.1`;
          sectionTitle = ``;
        }
        const contentSection: ContentSection = {
          id: sectionId,
          title: sectionTitle,
          items: []
        };
        // Parse items from the ul that follows the Students paragraph
        const ul = $studentP.next('ul');
        if (ul.length) {
          ul.children('li').each((_, li) => {
            let mainHtml = $(li).clone().children('ul').remove().end().html()?.trim() || '';
            let subpoints: ProgressItem[] = [];
            $(li).children('ul').children('li').each((_, subli) => {
              let subHtml = $(subli).clone().children('ul').remove().end().html()?.trim() || '';
              let nested: ProgressItem[] = [];
              $(subli).children('ul').children('li').each((_, subsubli) => {
                let subSubHtml = $(subsubli).clone().children('ul').remove().end().html()?.trim() || '';
                nested.push({
                  id: `${sectionId}.${contentSection.items.length + 1}.${subpoints.length + 1}.${nested.length + 1}`,
                  text: subSubHtml,
                  status: { unsure: false, revise: false, confident: false, practised: false },
                });
              });
              subpoints.push({
                id: `${sectionId}.${contentSection.items.length + 1}.${subpoints.length + 1}`,
                text: subHtml,
                status: { unsure: false, revise: false, confident: false, practised: false },
                ...(nested.length > 0 ? { subpoints: nested } : {})
              });
            });
            const item: ProgressItem = {
              id: `${sectionId}.${contentSection.items.length + 1}`,
              text: mainHtml,
              status: { unsure: false, revise: false, confident: false, practised: false },
              ...(subpoints.length > 0 ? { subpoints } : {})
            };
            contentSection.items.push(item);
          });
        }
        if (contentSection.items.length > 0) {
          subTopic.contentSections.push(contentSection);
        }
      }
      topic.subTopics.push(subTopic);
    }
    topics.push(topic);
  });

  // Merge duplicate topics by id, including all children
  const mergedTopics: Topic[] = [];
  for (const topic of topics) {
    const existing = mergedTopics.find(t => t.id === topic.id);
    if (!existing) {
      mergedTopics.push(topic);
    } else {
      // Merge subTopics by code
      for (const sub of topic.subTopics) {
        const existingSub = existing.subTopics.find(s => s.code === sub.code);
        if (!existingSub) {
          existing.subTopics.push(sub);
        } else {
          // Merge contentSections by id
          for (const section of sub.contentSections) {
            const existingSection = existingSub.contentSections.find(cs => cs.id === section.id);
            if (!existingSection) {
              existingSub.contentSections.push(section);
            } else {
              // Merge items by id
              for (const item of section.items) {
                if (!existingSection.items.some(i => i.id === item.id)) {
                  existingSection.items.push(item);
                }
              }
            }
          }
        }
      }
    }
  }

  console.log(mergedTopics);
  return { topics: mergedTopics };
}
