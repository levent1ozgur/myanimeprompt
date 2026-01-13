// © 2025 MyAnimePrompt by Levent Özgür

// Convert XML to markdown with recommendation prompt
document.getElementById("convertBtn").addEventListener("click", function () {
  const fileInput = document.getElementById("fileInput");
  if (fileInput.files.length === 0) {
    alert("Please select an XML file.");
    return;
  }
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const xmlText = e.target.result;
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const animeElements = xmlDoc.getElementsByTagName("anime");
    const animeEntries = [];

    // Process each anime entry, filtering for Completed entries
    for (let i = 0; i < animeElements.length; i++) {
      const statusNode = animeElements[i].getElementsByTagName("my_status")[0];
      if (!statusNode || statusNode.textContent.trim() !== "Completed")
        continue;

      const titleNode = animeElements[i].getElementsByTagName(
        "series_title"
      )[0];
      const scoreNode = animeElements[i].getElementsByTagName("my_score")[0];
      if (!titleNode || !scoreNode) continue;

      const title = titleNode.textContent
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .trim();
      const score = parseFloat(scoreNode.textContent.trim()) || 0;

      // Add a flag to mark if this entry has been grouped
      animeEntries.push({ title, score, grouped: false });
    }

    // Sort the anime entries by title length (shortest first)
    animeEntries.sort((a, b) => a.title.length - b.title.length);

    // Group entries by base title (i.e. if one title is a prefix of the others)
    const groupedAnime = [];
    for (let i = 0; i < animeEntries.length; i++) {
      if (animeEntries[i].grouped) continue; // already grouped

      const baseTitle = animeEntries[i].title;
      let totalScore = animeEntries[i].score;
      let count = 1;
      animeEntries[i].grouped = true;

      // Look for entries with titles that start with the base title
      for (let j = i + 1; j < animeEntries.length; j++) {
        if (
          !animeEntries[j].grouped &&
          animeEntries[j].title.startsWith(baseTitle)
        ) {
          totalScore += animeEntries[j].score;
          count++;
          animeEntries[j].grouped = true;
        }
      }
      // Calculate average rating, rounded to one decimal place.
      const avgRating = parseFloat((totalScore / count).toFixed(1));
      groupedAnime.push({ title: baseTitle, score: avgRating });
    }

    // Sort the grouped anime by average rating (highest first)
    groupedAnime.sort((a, b) => b.score - a.score);

    // Build the output string starting with the recommendation prompt.
    let outputMarkdown = `**Role**:  
*Act as an expert anime recommendation system with deep knowledge of genres, themes, and storytelling styles.*

**Task**:  
*Analyze the provided table of my anime preferences and ratings to recommend 10 new titles. Prioritize anime that share:*  
- *Genres/themes with my highest-rated shows (e.g., psychological depth, sports, emotional drama).*  
- *Exclude direct sequels, prequels, or movie adaptations of titles I’ve already watched.*  
- *The table contains both English and Japanese titles (e.g., "Kimi no Na wa.” instead of ”Your Name"), do not recommend the duplicate title in any language.*

**Format**:  
*Provide a markdown table with the following columns: **Title**, **Genre**, **Why Recommended** (link to my preferences), and **Streaming Platform** (note regional variations). Additionally, include a summary explaining the patterns in my taste (e.g., "You favor intense action with moral ambiguity") and how the recommendations align with those patterns.*

**Table**:\n\n`;

    // Build the Markdown table.
    outputMarkdown += `| Anime Title | My rating |\n`;
    outputMarkdown += `|-------------|-----------|\n`;
    groupedAnime.forEach((anime) => {
      outputMarkdown += `| ${anime.title} | ${anime.score} |\n`;
    });

    document.getElementById("output").value = outputMarkdown;
  };

  reader.readAsText(file);
});

// Copy prompt button functionality
document.getElementById("copyBtn").addEventListener("click", function () {
  const outputText = document.getElementById("output").value;
  navigator.clipboard
    .writeText(outputText)
    .then(() => alert("Prompt copied to clipboard!"))
    .catch((err) => alert("Failed to copy prompt: " + err));
});
