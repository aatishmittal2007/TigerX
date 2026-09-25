"""
TigerGraph MCP Bridge
Standardized Model Context Protocol tool interfaces for fraud investigation.
Provides controlled, least-privilege tool execution for n8n and the Grok Agent.
"""

from typing import Dict, Any, List
from tigergraph.tigergraph_service import fraud_graph_service

def execute_mcp_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes an approved TigerGraph MCP tool with strict input validation.
    """
    if tool_name == "tg_get_card_history":
        card_id = arguments.get("card_id")
        limit = arguments.get("limit", 50)
        if not card_id:
            return {"error": "Missing card_id parameter"}
        txns = fraud_graph_service.get_card_history(card_id, limit=limit)
        return {"tool": tool_name, "card_id": card_id, "count": len(txns), "transactions": txns}

    elif tool_name == "tg_get_velocity_window":
        card_id = arguments.get("card_id")
        ref_ts = arguments.get("ref_ts")
        hours = arguments.get("hours", 2.0)
        if not card_id or not ref_ts:
            return {"error": "Missing card_id or ref_ts parameter"}
        txns = fraud_graph_service.get_card_velocity_window(card_id, ref_ts, hours=hours)
        return {"tool": tool_name, "card_id": card_id, "window_hours": hours, "transactions": txns}

    elif tool_name == "tg_get_device_neighbors":
        device_id = arguments.get("device_id")
        if not device_id:
            return {"error": "Missing device_id parameter"}
        res = fraud_graph_service.get_device_neighbors(device_id)
        return {"tool": tool_name, "device_id": device_id, "result": res}

    elif tool_name == "tg_get_customer_regions":
        customer_id = arguments.get("customer_id")
        if not customer_id:
            return {"error": "Missing customer_id parameter"}
        regions = fraud_graph_service.get_customer_regions(customer_id)
        return {"tool": tool_name, "customer_id": customer_id, "regions": regions}

    elif tool_name == "tg_get_prior_cases":
        card_id = arguments.get("card_id")
        if not card_id:
            return {"error": "Missing card_id parameter"}
        cases = fraud_graph_service.get_card_prior_cases(card_id)
        return {"tool": tool_name, "card_id": card_id, "prior_cases": cases}

    elif tool_name == "tg_search_similar_cases":
        pattern = arguments.get("pattern", "card_not_present_fraud")
        limit = arguments.get("limit", 3)
        cases = fraud_graph_service.search_similar_cases(pattern, limit=limit)
        return {"tool": tool_name, "pattern": pattern, "similar_cases": cases}

    elif tool_name == "tg_write_case":
        case_record = arguments.get("case_record", {})
        if not case_record:
            return {"error": "Missing case_record parameter"}
        stored_id = fraud_graph_service.write_case_to_graph(case_record)
        return {"tool": tool_name, "status": "stored", "graph_case_id": stored_id}

    else:
        return {"error": f"Unknown MCP tool: {tool_name}"}

# List of available MCP tools
MCP_TOOL_DEFINITIONS = [
    {
        "name": "tg_get_card_history",
        "description": "Retrieve recent transactions for a card ordered by timestamp.",
        "parameters": {"type": "object", "properties": {"card_id": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["card_id"]}
    },
    {
        "name": "tg_get_velocity_window",
        "description": "Retrieve transactions within a time window (e.g. 1-2 hours) to detect card testing or velocity spikes.",
        "parameters": {"type": "object", "properties": {"card_id": {"type": "string"}, "ref_ts": {"type": "string"}, "hours": {"type": "number"}}, "required": ["card_id", "ref_ts"]}
    },
    {
        "name": "tg_get_device_neighbors",
        "description": "Discover multi-card rings and prior cases sharing a DeviceProfile.",
        "parameters": {"type": "object", "properties": {"device_id": {"type": "string"}}, "required": ["device_id"]}
    },
    {
        "name": "tg_get_customer_regions",
        "description": "Retrieve historical billing region distribution for a customer to verify travel vs out-of-region fraud.",
        "parameters": {"type": "object", "properties": {"customer_id": {"type": "string"}}, "required": ["customer_id"]}
    },
    {
        "name": "tg_get_prior_cases",
        "description": "Retrieve historical closed cases directly involving a card.",
        "parameters": {"type": "object", "properties": {"card_id": {"type": "string"}}, "required": ["card_id"]}
    },
    {
        "name": "tg_search_similar_cases",
        "description": "Retrieve historical closed cases matching a specific fraud pattern.",
        "parameters": {"type": "object", "properties": {"pattern": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["pattern"]}
    },
    {
        "name": "tg_write_case",
        "description": "Store closed fraud case memory in TigerGraph.",
        "parameters": {"type": "object", "properties": {"case_record": {"type": "object"}}, "required": ["case_record"]}
    }
]
