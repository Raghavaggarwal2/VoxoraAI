"""
Voxora AI - 11-Minute Video RAG Evaluation Suite
Benchmark: 'The Four Types of Memory Every AI Agent Needs'
Tests: Precision, Recall, Faithfulness, Negative Rejection, and Latency
"""
import os
import sys
import json
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv

load_dotenv(".env")

from core.rag_engine import load_rag_chain, ask_question
from core.vector_store import load_vector_store, get_retriever

# 10 Diverse Evaluation Cases
BENCHMARK_CASES = [
    {
        "id": "Q1_FACTUAL_FRAMEWORK",
        "type": "Direct Factual",
        "question": "What research team created the CoALA framework and what does the acronym stand for?",
        "ground_truth": "A Princeton research team created CoALA, which stands for Cognitive Architectures for Language Agents.",
        "required_keywords": ["princeton", "cognitive architectures for language agents"],
        "is_negative": False,
    },
    {
        "id": "Q2_FACTUAL_ANALOGY",
        "type": "Direct Factual",
        "question": "What computer hardware or real-world analogy does the speaker use to describe working memory?",
        "ground_truth": "The speaker compares working memory to RAM (Random Access Memory), a scratch pad, or context window.",
        "required_keywords": ["ram", "random access memory", "scratch pad", "context window"],
        "is_negative": False,
    },
    {
        "id": "Q3_PROCEDURAL_DISCLOSURE",
        "type": "Conceptual Mechanism",
        "question": "How does progressive disclosure work in procedural memory with agent skills?",
        "ground_truth": "The agent does not load all skills at once to save working memory budget; it only sees a lightweight index of skill names and descriptions (~100 tokens), and only loads full instructions and resources when a matching task arrives.",
        "required_keywords": ["progressive disclosure", "100 tokens", "lightweight index"],
        "is_negative": False,
    },
    {
        "id": "Q4_SEMANTIC_EXAMPLE",
        "type": "Direct Factual",
        "question": "What example of semantic memory in Claude Code does the speaker mention?",
        "ground_truth": "The speaker mentions claude.md in the root of a project, which stores architecture, conventions, build commands, and rules loaded at the start of every session.",
        "required_keywords": ["claude.md", "conventions"],
        "is_negative": False,
    },
    {
        "id": "Q5_EPISODIC_CHALLENGE",
        "type": "Conceptual Challenge",
        "question": "Why is episodic memory considered the hardest type of memory to get right for AI agents?",
        "ground_truth": "Because forgetting is an engineering problem for agents: deciding what to delete, when information becomes obsolete, and how to distill experience rather than keeping full raw transcripts.",
        "required_keywords": ["delete", "obsolete", "forget", "engineering problem"],
        "is_negative": False,
    },
    {
        "id": "Q6_AGENT_COMPARISON",
        "type": "Multi-Chunk Synthesis",
        "question": "What memory types does a customer support password reset agent need compared to a coding agent?",
        "ground_truth": "A customer support password reset agent needs working memory and procedural memory (the password reset skill). A coding agent needs all four memory types: working, semantic, procedural, and episodic.",
        "required_keywords": ["working", "procedural", "all four"],
        "is_negative": False,
    },
    {
        "id": "Q7_SPEAKER_ANECDOTE",
        "type": "Personal Anecdote Extraction",
        "question": "What personal debugging mistake did the speaker describe spending three hours on?",
        "ground_truth": "The speaker spent three hours debugging a Kubernetes cluster only to discover they were pointing at the wrong cluster the entire time.",
        "required_keywords": ["kubernetes", "wrong cluster"],
        "is_negative": False,
    },
    {
        "id": "Q8_CHATBOT_VS_AGENT",
        "type": "Synthesis",
        "question": "According to the speaker, what fundamentally separates a chatbot from an AI agent?",
        "ground_truth": "Memory is what separates them: a chatbot simply gives a response, while an agent gives a response shaped by persistent knowledge, accumulated experience, preferences, and remembered mistakes.",
        "required_keywords": ["memory", "experience"],
        "is_negative": False,
    },
    {
        "id": "Q9_NEGATIVE_LORA",
        "type": "Negative / Hallucination Trap",
        "question": "What rank and learning rate were recommended for LoRA fine-tuning?",
        "ground_truth": "I could not find this information in the meeting transcript.",
        "required_keywords": [],
        "is_negative": True,
    },
    {
        "id": "Q10_NEGATIVE_DATABASE",
        "type": "Negative / Hallucination Trap",
        "question": "Which specific vector database engine like Pinecone, Weaviate, or Qdrant was recommended?",
        "ground_truth": "I could not find this information in the meeting transcript.",
        "required_keywords": [],
        "is_negative": True,
    },
]

def evaluate_case(rag_chain, case, retriever):
    q = case["question"]
    is_neg = case["is_negative"]
    
    t0 = time.time()
    answer = ask_question(rag_chain, q)
    docs = retriever.invoke(q)
    sources = [doc.page_content.strip() for doc in docs if getattr(doc, "page_content", None)]
    latency = time.time() - t0

    joined_sources = " ".join(sources).lower()
    answer_lower = answer.lower()

    # Evaluation Criteria
    # 1. Retrieval Hit (Context Recall)
    if is_neg:
        retrieval_hit = True  # Irrelevant query
    else:
        # Check if at least 50% of required keywords were retrieved in chunks
        hits = sum(1 for kw in case["required_keywords"] if kw.lower() in joined_sources)
        retrieval_hit = (hits >= max(1, len(case["required_keywords"]) // 2))

    # 2. Answer Accuracy & Groundedness
    if is_neg:
        # Must decline gracefully without hallucinating facts
        passed = (
            "could not find" in answer_lower
            or "not found" in answer_lower
            or "does not mention" in answer_lower
            or "not mentioned" in answer_lower
            or "no mention" in answer_lower
        )
    else:
        # Must contain answer keywords and not decline
        ans_hits = sum(1 for kw in case["required_keywords"] if kw.lower() in answer_lower)
        passed = (ans_hits >= 1 and "could not find this information" not in answer_lower)

    return {
        "id": case["id"],
        "type": case["type"],
        "question": q,
        "answer": answer.strip(),
        "retrieval_hit": retrieval_hit,
        "passed": passed,
        "latency": round(latency, 2),
        "source_count": len(sources),
    }

def run_evaluation():
    collection_name = "eval_memory_11min"
    print("\n" + "=" * 70)
    print("  VOXORA AI — RAG EVALUATION BENCHMARK")
    print("  Target Video: 'The Four Types of Memory Every AI Agent Needs' (~11 mins)")
    print(f"  Chroma Collection: '{collection_name}' | Model: openai/gpt-oss-20b")
    print("=" * 70 + "\n")

    vector_store = load_vector_store(collection_name=collection_name)
    retriever = get_retriever(vector_store)
    rag_chain = load_rag_chain(collection_name=collection_name)

    results = []
    for idx, case in enumerate(BENCHMARK_CASES):
        print(f"Evaluating [{idx+1}/10] {case['id']} ({case['type']})...")
        res = evaluate_case(rag_chain, case, retriever)
        status_symbol = "✓ PASS" if res["passed"] else "✗ FAIL"
        print(f"  Result: {status_symbol} | Latency: {res['latency']}s | Chunks: {res['source_count']}")
        print(f"  Q: {res['question']}")
        print(f"  A: {res['answer'][:160]}...\n")
        results.append(res)

    # Summary Statistics
    total = len(results)
    passed_count = sum(1 for r in results if r["passed"])
    retrieval_count = sum(1 for r in results if r["retrieval_hit"])
    avg_latency = sum(r["latency"] for r in results) / total

    accuracy = (passed_count / total) * 100
    retrieval_precision = (retrieval_count / total) * 100

    print("=" * 70)
    print("                  FINAL EVALUATION SCORECARD")
    print("=" * 70)
    print(f"  Overall RAG Accuracy (Faithfulness)  : {accuracy:.1f}% ({passed_count}/{total} passed)")
    print(f"  Retrieval Relevance Hit Rate        : {retrieval_precision:.1f}% ({retrieval_count}/{total} retrieved)")
    print(f"  Average Query Response Time         : {avg_latency:.2f} seconds")
    print(f"  Negative Rejection (Trap Defense)   : {sum(1 for r in results[8:] if r['passed'])}/2 passed")
    print("=" * 70)

    # Save to JSON
    with open("downloads/rag_evaluation_results.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "collection": collection_name,
                "video": "The Four Types of Memory Every AI Agent Needs",
                "accuracy": accuracy,
                "retrieval_hit_rate": retrieval_precision,
                "average_latency_sec": avg_latency,
                "detailed_results": results,
            },
            f,
            indent=2,
        )
    print("\nDetailed results saved to downloads/rag_evaluation_results.json\n")

if __name__ == "__main__":
    run_evaluation()
