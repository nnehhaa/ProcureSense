import streamlit as st

st.set_page_config(
    page_title="ProcureSense",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

with open("styles/style.css") as f:

    st.markdown(
        f"<style>{f.read()}</style>",
        unsafe_allow_html=True
    )

st.markdown(
    """
    <div class="hero-container">

        <h1 class="main-title">
            ProcureSense
        </h1>

        <h2 class="subtitle">
            Analyze. Compare. Negotiate.
        </h2>

        <p class="tagline">
            AI-Powered Procurement Contract Intelligence
        </p>

    </div>
    """,
    unsafe_allow_html=True
)

st.markdown(
    """
    <div class="welcome-card">

    Upload contracts from the navigation panel to begin.

    </div>
    """,
    unsafe_allow_html=True
)