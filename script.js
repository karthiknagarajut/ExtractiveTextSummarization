const textForm = document.getElementById('text-form');
const result = document.getElementById('result');


function tokenize(text) {
    return text.toLowerCase().split(/\W+/).filter(Boolean);
}

function computeTF(words) {
    let tf = {};
    words.forEach(word => {
        tf[word] = (tf[word] || 0) + 1;
    });

    const wordCount = words.length;
    for (const word in tf) {
        tf[word] /= wordCount;
    }

    return tf;
}


function computeIDF(sentences) {
    let idf = {};
    let totalDocs = sentences.length;

    sentences.forEach(sentence => {
        const words = new Set(tokenize(sentence));
        words.forEach(word => {
            idf[word] = (idf[word] || 0) + 1;
        });
    })

    for (const word in idf) {
        idf[word] = Math.log(totalDocs / idf[word]);
    }

    return idf;
}


function computeTFIDF(sentences) {
    const tfIdfVectors = [];
    const idf = computeIDF(sentences);

    sentences.forEach(sentence => {
        const words = tokenize(sentence);
        const tf = computeTF(words);
        const tfIdf = {};
        
        words.forEach(word => tfIdf[word] = tf[word] * (idf[word] || 0));

        tfIdfVectors.push(tfIdf);
    });

    return tfIdfVectors;
}


function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0, magA = 0, magB = 0;

    let allWords = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

    allWords.forEach(word => {
        let a = vecA[word] || 0;
        let b = vecB[word] || 0;

        dotProduct += a * b;
        magA += a * a;
        magB += b * b;
    });

    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}


function getSummary(text, numSentences) {
    const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
    const tfIdfVectors = computeTFIDF(sentences);

    const documentVector = {};
    tfIdfVectors.forEach(vec => {
        for (const word in vec) {
            documentVector[word] = (documentVector[word] || 0) + vec[word];
        }
    });

    const sentencesScores = sentences.map((sentence, index) => ({
        sentence,
        score: cosineSimilarity(tfIdfVectors[index], documentVector)
    }));

    return sentencesScores
        .sort((a, b) => b.score - a.score)
        .slice(0, numSentences)
        .map(entry => entry.sentence)
        .join(" ");
}


textForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const data = new FormData(this);

    result.textContent = getSummary(data.get('text'), data.get('num-sentences'));
})