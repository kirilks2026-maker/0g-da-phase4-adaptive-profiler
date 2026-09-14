const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');

const envPath = fs.existsSync(path.join(__dirname, '.env')) 
    ? path.join(__dirname, '.env') 
    : path.join(__dirname, '../.env');

require('dotenv').config({ path: envPath });

// CLI и RPC Настройки
const CLI_PATH = path.join(__dirname, './0g-storage-client/0g-storage-client');
const RPC_URL = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const INDEXER_URL = process.env.INDEXER_URL || 'https://indexer-storage-testnet-turbo.0g.ai';

const START_TIME = Date.now();

// Цвета консоли
const C = {
    cyan: (s) => `\x1b[36m${s}\x1b[0m`,
    green: (s) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s) => `\x1b[33m${s}\x1b[0m`,
    red: (s) => `\x1b[31m${s}\x1b[0m`,
    gray: (s) => `\x1b[90m${s}\x1b[0m`,
    bold: (s) => `\x1b[1m${s}\x1b[0m`
};

// Загрузка приватных ключей воркеров
const privateKeys = Object.keys(process.env)
    .filter(key => key.startsWith('PRIVATE_KEY_'))
    .map(key => process.env[key].replace(/['"\r\n\s]/g, '').trim())
    .map(pk => pk.startsWith('0x') ? pk.slice(2) : pk)
    .filter(pk => pk.length === 64);

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// Высокоточный таймлайн [+ММ:СС.ммм]
function getTimelineMark() {
    const elapsed = Date.now() - START_TIME;
    const minutes = String(Math.floor(elapsed / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
    const ms = String(elapsed % 1000).padStart(3, '0');
    return `[+${minutes}:${seconds}.${ms}]`;
}

// Форматирование логов в ровный столбик
function formatLog(workerId, tag, status, details, colorFn) {
    const timeMark = getTimelineMark();
    const pWorker = String(workerId).padStart(2, '0');
    const pTag = String(tag).padEnd(8, ' ');
    const pStatus = String(status).padEnd(9, ' ');
    const rawLine = `${timeMark} [Worker #${pWorker} | Tag ${pTag}] ${pStatus}: ${details}`;
    return colorFn ? colorFn(rawLine) : rawLine;
}

// Буфер и генерация уникальных файлов (Anti-Compression + Unique Merkle Root)
let currentAllocatedSizeMB = 0;
let BASE_BUFFER = null;

function ensureBufferAllocation(targetSizeMB) {
    if (currentAllocatedSizeMB !== targetSizeMB) {
        console.log(C.gray(`${getTimelineMark()} ⚡ Allocating dynamic ${targetSizeMB}MB RAM buffer (Anti-Compression pattern)...`));
        // Заполняем рандомом для защиты от алгоритмов сжатия (gzip/zstd)
        BASE_BUFFER = crypto.randomBytes(targetSizeMB * 1024 * 1024);
        currentAllocatedSizeMB = targetSizeMB;
    }
}

function generateMutatedFile(filePath, sizeMB) {
    ensureBufferAllocation(sizeMB);
    const fd = fs.openSync(filePath, 'w');
    fs.writeSync(fd, BASE_BUFFER, 0, BASE_BUFFER.length);
    fs.writeSync(fd, crypto.randomBytes(16)); // Уникальный хвост против дедупликации
    fs.closeSync(fd);
}

const benchmarkReport = {
    timestamp: new Date().toISOString(),
    framework_phase: "Phase-4 (Adaptive Dynamic Load Profiler)",
    summary: {
        total_success_txs: 0,
        total_failed_txs: 0,
        total_payload_uploaded_mb: 0,
        failure_threshold_chunk_mb: null
    },
    epochs: []
};

async function uploadBatchAsync(workerIndex, key, tag, chunkSizeMB) {
    const workerId = workerIndex + 1;
    const fileName = `dummy_w${workerId}_t${tag}.tmp`;
    const filePath = path.join(__dirname, fileName);

    try {
        generateMutatedFile(filePath, chunkSizeMB);
        const cmd = `${CLI_PATH} upload --url ${RPC_URL} --indexer ${INDEXER_URL} --key ${key} --file ${filePath} --skip-tx`;

        return new Promise((resolve) => {
            const start = Date.now();
            exec(cmd, (error, stdout, stderr) => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                const timeSec = parseFloat(((Date.now() - start) / 1000).toFixed(2));

                if (error) {
                    const errLine = (stderr || error.message).split('\n')[0];
                    console.log(formatLog(workerId, tag, "Failed", errLine, C.red));
                    resolve({ success: false, workerId, timeSec, error: errLine, chunkSizeMB });
                } else {
                    console.log(formatLog(workerId, tag, "Ingested", `${chunkSizeMB}MB in ${timeSec}s`, C.green));
                    resolve({ success: true, workerId, timeSec, chunkSizeMB });
                }
            });
        });
    } catch (e) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return { success: false, workerId, error: e.message, chunkSizeMB };
    }
}

async function startAdaptiveSwarm() {
    console.log(C.bold(C.cyan(`\n🚀 [Phase 4] Starting Dynamic Adaptive Load Profiler`)));
    console.log(C.cyan(`📊 Configuration: ${privateKeys.length} Workers | Dynamic Scaling (50MB ➔ 500MB)\n`));
    
    if (privateKeys.length === 0) {
        console.log(C.red(`${getTimelineMark()} ❌ No valid 64-character private keys found in .env!`));
        return;
    }

    let chunkSizeMB = 50; 
    const chunkSizeStepMB = 50;
    const maxChunkSizeMB = 500;
    let epoch = 1;

    while (chunkSizeMB <= maxChunkSizeMB) {
        const totalChunksInEpoch = privateKeys.length * 2;
        console.log(C.bold(C.yellow(`\n➔ 🧭 Epoch x${epoch} [Step: ${chunkSizeMB}MB/chunk | Load: ${totalChunksInEpoch} Chunks (${(totalChunksInEpoch * chunkSizeMB / 1024).toFixed(2)} GB)]`)));
        
        const epochStart = Date.now();
        let successfulChunks = 0;
        let failedChunks = 0;
        const epochResults = [];

        for (let chunkIndex = 0; chunkIndex < totalChunksInEpoch; chunkIndex += privateKeys.length) {
            const tasks = [];
            const activeWorkers = Math.min(privateKeys.length, totalChunksInEpoch - chunkIndex);

            for (let i = 0; i < activeWorkers; i++) {
                tasks.push(uploadBatchAsync(i, privateKeys[i], `${epoch}_c${chunkIndex + i}`, chunkSizeMB));
                await sleep(300);
            }

            const batchResults = await Promise.all(tasks);
            
            batchResults.forEach(r => {
                epochResults.push(r);
                if (r.success) successfulChunks++;
                else failedChunks++;
            });
        }

        const epochTimeSec = parseFloat(((Date.now() - epochStart) / 1000).toFixed(2));
        const dropRate = parseFloat(((failedChunks / totalChunksInEpoch) * 100).toFixed(1));

        benchmarkReport.epochs.push({
            epoch: epoch,
            chunk_size_mb: chunkSizeMB,
            total_chunks: totalChunksInEpoch,
            duration_sec: epochTimeSec,
            successful: successfulChunks,
            failed: failedChunks,
            drop_rate_percent: dropRate,
            details: epochResults
        });

        benchmarkReport.summary.total_success_txs += successfulChunks;
        benchmarkReport.summary.total_failed_txs += failedChunks;
        benchmarkReport.summary.total_payload_uploaded_mb += (successfulChunks * chunkSizeMB);

        console.log(C.bold(`${getTimelineMark()} 📈 Epoch x${epoch} (${chunkSizeMB}MB) Finished: ${successfulChunks} OK / ${failedChunks} Failed | Duration: ${epochTimeSec}s | Drop Rate: ${dropRate}%`));

        if (dropRate > 30.0) {
            benchmarkReport.summary.failure_threshold_chunk_mb = chunkSizeMB;
            console.log(C.bold(C.red(`\n🛑 [Circuit Breaker] Failure Threshold Discovered at ${chunkSizeMB}MB per chunk! (Drop Rate: ${dropRate}%)`)));
            break;
        }

        chunkSizeMB += chunkSizeStepMB;
        epoch++;
    }

    const reportPathLocal = path.join(__dirname, 'benchmark_detailed_report.json');
    const reportPathRoot = path.join(__dirname, '../benchmark_detailed_report.json');
    const reportData = JSON.stringify(benchmarkReport, null, 4);
    
    fs.writeFileSync(reportPathLocal, reportData);
    fs.writeFileSync(reportPathRoot, reportData);
    
    console.log(C.bold(C.cyan(`\n💾 Benchmarking complete. Telemetry saved to:`)));
    console.log(C.gray(`   - ${reportPathLocal}`));
    console.log(C.gray(`   - ${reportPathRoot}`));
    console.log(C.bold(C.green(`🏁 Dynamic Profiling Complete. Total Ingested: ${benchmarkReport.summary.total_payload_uploaded_mb} MB\n`)));
}

startAdaptiveSwarm();
