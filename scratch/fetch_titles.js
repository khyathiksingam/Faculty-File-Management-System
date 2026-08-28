const urls = [
  'https://docs.google.com/document/d/1aZrGqu0sOMcQV_1zoa-ef2rvWSuxumHh/edit?usp=drive_link',
  'https://drive.google.com/file/d/1VLOYLXAhuPR3OsO9zFn1nk35dunSX3zr/view?usp=drive_link',
  'https://docs.google.com/document/d/1DkfuhoDid9472fWKfNBiaI9K1jONn6Tz/edit?usp=drive_link',
  'https://drive.google.com/file/d/12succ16Vf6_5OWyvQz1-QtV0tnEAfLUf/view?usp=drive_link',
  'https://docs.google.com/document/d/1m-2JxiISorTM5Te3pYd1M7H3q8TqCwtP/edit?usp=drive_link',
  'https://docs.google.com/document/d/1wyxD-UUqi6pwC0qOcJcSEKJ1dPV_qfDq/edit?usp=drive_link',
  'https://drive.google.com/file/d/1aDooxThb-_TwvEy8UQ3fk7B4Potxt9VU/view?usp=drive_link',
  'https://docs.google.com/document/d/1YcA4hMs4OOWP7kpnmrGEm6JPYfj2itf_/edit?usp=drive_link',
  'https://drive.google.com/drive/folders/1GeVXDBPqIXEOfavWI13PWBbfBs4CVZaX?usp=drive_link',
  'https://drive.google.com/drive/folders/1Vjk59_zfmxFqH9k1wErGtYJSTP9qefn6?usp=drive_link',
  'https://drive.google.com/drive/folders/1wqPFbJk5HrKRnDBwHvZFQxd6I63CPt1e?usp=drive_link',
  'https://drive.google.com/drive/folders/1plZBs19PpZ0fCq3KOJMmm06iyHK9vHsd?usp=drive_link',
  'https://drive.google.com/drive/folders/1PGlQlDAf1UAlIC2rMejcVOtPT5bIqd5m?usp=drive_link',
  'https://drive.google.com/drive/folders/18o9S-U8KYC3otrJvaEBqh-raYaGVZntS?usp=drive_link',
  'https://drive.google.com/drive/folders/1Fezq_aeEnPcz1vWYTQ3upj9hkd0PHeaH?usp=drive_link',
  'https://drive.google.com/drive/folders/1RMkynGDrkoD5t_aTUnbPuOtyr05E94B4?usp=drive_link',
  'https://drive.google.com/drive/folders/1xm2erGIeTGGdEwKhLjuwVoXI2lw_6ACu?usp=drive_link',
  'https://drive.google.com/drive/folders/10IkxGvLwKORbBO6fikDvsCi5LVD9wWlG?usp=drive_link'
];

async function run() {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const html = await res.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      const nameMatch = html.match(/itemprop=["']name["']\s+content=["']([^"']+)["']/i);
      console.log(`[${i + 1}] URL: ${url}`);
      console.log(`     Title: ${titleMatch ? titleMatch[1] : 'N/A'}`);
      console.log(`     OG: ${ogTitleMatch ? ogTitleMatch[1] : 'N/A'}`);
      console.log(`     ItemProp: ${nameMatch ? nameMatch[1] : 'N/A'}`);
    } catch (err) {
      console.log(`[${i + 1}] Error: ${err.message}`);
    }
  }
}

run();
