import ollama

# Example function to chat with the model
def chat_with_deepseek(prompt):
    response = ollama.chat(
        model="deepseek-r1:7b", # Ensure this matches the version you pulled
        messages=[
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )
    return response["message"]["content"]

# Main interaction loop
if __name__ == "__main__":
    print("Chat with DeepSeek R1! Type 'exit' to end the chat.")
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() == "exit":
            break
        response = chat_with_deepseek(user_input)
        print(f"DeepSeek: {response}")
