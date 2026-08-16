import os
import re
import streamlit as st
import plotly.express as px

from contract_parser import extract_text
from extractor import extract_contract_details
from dashboard import create_dashboard
from chunker import split_text
from embeddings import create_embeddings
from vector_store import store_chunks
from rag_engine import ask_contract
from alerts import get_renewal_alerts
from score import calculate_score


st.set_page_config(
    page_title="ProcureSense",
    layout="wide"
)

os.makedirs(
    "contracts",
    exist_ok=True
)

st.title("📄 ProcureSense")

uploaded_files = st.file_uploader(
    "📄 Upload Procurement Contracts",
    type=["pdf"],
    accept_multiple_files=True
)

if uploaded_files:

    all_contracts = []

    for uploaded_file in uploaded_files:

        file_path = os.path.join(
            "contracts",
            uploaded_file.name
        )

        with open(file_path, "wb") as f:

            f.write(
                uploaded_file.getbuffer()
            )

        text = extract_text(
            file_path
        )

        details = extract_contract_details(
            text
        )

        chunks = split_text(
            text
        )

        embeddings = create_embeddings(
            chunks
        )

        store_chunks(
            chunks,
            embeddings
        )

        all_contracts.append(
            details
        )

    st.success(
        f"{len(all_contracts)} contracts processed successfully!"
    )

    dashboard = create_dashboard(
        all_contracts
    )

    dashboard["score"] = dashboard.apply(
        calculate_score,
        axis=1
    )

    alerts = get_renewal_alerts(
        all_contracts
    )

    col1, col2, col3, col4 = st.columns(4)

    with col1:

        st.metric(
            "📑 Contracts",
            len(all_contracts)
        )

    with col2:

        sla_values = []

        for contract in all_contracts:

            match = re.search(
                r"\d+\.?\d*",
                str(
                    contract.get(
                        "sla",
                        "100"
                    )
                )
            )

            if match:

                sla_values.append(
                    float(
                        match.group()
                    )
                )

        avg_sla = (
            sum(sla_values)
            / len(sla_values)
            if sla_values
            else 0
        )

        st.metric(
            "⚡ Average SLA",
            f"{avg_sla:.1f}%"
        )

    with col3:

        escalation_values = []

        for contract in all_contracts:

            match = re.search(
                r"\d+",
                str(
                    contract.get(
                        "price_escalation",
                        "0"
                    )
                )
            )

            if match:

                escalation_values.append(
                    int(
                        match.group()
                    )
                )

        avg_escalation = (
            sum(escalation_values)
            / len(escalation_values)
            if escalation_values
            else 0
        )

        st.metric(
            "📈 Average Escalation",
            f"{avg_escalation:.1f}%"
        )

    with col4:

        st.metric(
            "🚨 Renewing Soon",
            len(alerts)
        )

    st.subheader(
        "📊 Procurement Dashboard"
    )

    st.dataframe(
        dashboard,
        use_container_width=True
    )

    dashboard["sla_numeric"] = dashboard[
        "sla"
    ].apply(
        lambda x: float(
            re.search(
                r"\d+\.?\d*",
                str(x)
            ).group()
        )
        if re.search(
            r"\d+\.?\d*",
            str(x)
        )
        else 100
    )

    dashboard["escalation_numeric"] = dashboard[
        "price_escalation"
    ].apply(
        lambda x: int(
            re.search(
                r"\d+",
                str(x)
            ).group()
        )
        if re.search(
            r"\d+",
            str(x)
        )
        else 0
    )

    st.subheader(
        "📈 Contract Analytics"
    )

    chart1, chart2 = st.columns(2)

    with chart1:

        fig = px.bar(
            dashboard,
            x="vendor",
            y="sla_numeric",
            title="SLA Comparison"
        )

        st.plotly_chart(
            fig,
            use_container_width=True
        )

    with chart2:

        fig = px.bar(
            dashboard,
            x="vendor",
            y="escalation_numeric",
            title="Price Escalation Comparison"
        )

        st.plotly_chart(
            fig,
            use_container_width=True
        )

    csv = dashboard.to_csv(
        index=False
    )

    st.download_button(
        "⬇️ Download Dashboard",
        csv,
        "ProcureSense_Report.csv",
        "text/csv"
    )

    if alerts:

        st.subheader(
            "🚨 Upcoming Renewals"
        )

        for alert in alerts:

            st.warning(
                f"{alert['vendor']} renews in "
                f"{alert['days']} days"
            )

    st.subheader(
        "💬 Ask ProcureSense"
    )

    question = st.text_input(
        "Ask a question about your contracts"
    )

    if st.button("Ask"):

        if question:

            answer = ask_contract(
                question
            )

            st.write(
                answer
            )