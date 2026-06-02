# Actionable items, decisions, questions

from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter

import os

def get_llm():
    return ChatMistralAI(model='mistral-small-latest', mistral_api_key=os.getenv("MISTRALAI_API_KEY"), temperature=0.2)

def split_transcript(transcript: str) -> list[str]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=200)
    return splitter.split_text(transcript)


def build_chunked_extractor(
    item_prompt: str,
    merge_prompt: str,
) -> callable:
    llm = get_llm()
    item_chain = ChatPromptTemplate.from_messages(
        [
            ("system", item_prompt),
            ("human", "{text}"),
        ]
    ) | llm | StrOutputParser()

    merge_chain = ChatPromptTemplate.from_messages(
        [
            ("system", merge_prompt),
            ("human", "{text}"),
        ]
    ) | llm | StrOutputParser()

    def extract(transcript: str) -> str:
        chunks = split_transcript(transcript)

        if not chunks:
            chunks = [transcript]

        chunk_outputs = [item_chain.invoke({"text": chunk}) for chunk in chunks]
        combined_output = "\n\n".join(chunk_outputs)

        if len(chunk_outputs) == 1:
            return chunk_outputs[0]

        return merge_chain.invoke({"text": combined_output})

    return extract


def extract_actionable_items(transcript: str) -> str:
    return build_chunked_extractor(
        "You are an expert meeting analyst. From the meeting transcript chunk, extract only the action items mentioned in that chunk. For each provide:\n"
        "- Task description\n"
        "- Owner (who is responsible)\n"
        "- Deadline (if mentioned, else write 'Not specified')\n\n"
        "Format as a numbered list. If none found say 'No action items found.'",
        "You are an expert meeting analyst. Merge these partial action-item lists into one final numbered list. Remove duplicates, keep the clearest wording, preserve owners and deadlines when available, and return 'No action items found.' if nothing actionable appears in the combined text.",
    )(transcript)


def extract_key_decisions(transcript: str) -> str:
    return build_chunked_extractor(
        "You are an expert meeting analyst. From the meeting transcript chunk, extract only the key decisions made in that chunk. Format as a numbered list. If none found say 'No key decisions found.'",
        "You are an expert meeting analyst. Merge these partial decision lists into one final numbered list. Remove duplicates, keep the clearest wording, and return 'No key decisions found.' if nothing decisive appears in the combined text.",
    )(transcript)


def extract_questions(transcript: str) -> str:
    return build_chunked_extractor(
        "From the meeting transcript chunk, extract all unresolved questions or topics needing follow-up that appear in that chunk. Format as a numbered list. If none found say 'No open questions found.'",
        "You are an expert meeting analyst. Merge these partial question lists into one final numbered list. Remove duplicates, keep the clearest wording, and return 'No open questions found.' if nothing still needs follow-up in the combined text.",
    )(transcript)

