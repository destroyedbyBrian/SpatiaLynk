# 🗺️ SpatiaLynk

A full-stack spatial intelligence platform that generates Top-K POI recommendations at multiple spatial granularities (city 🌆 -> suburb 🏘️ -> building 🏢) enabling context-aware, hyper-local suggestions for users.

---

## 💻 Front-end Technologies
- ReactNative
- TypeScript
- Styled-components
- Expo

---

## 🖥️ Back-end Technologies (Model)
- Python
- FastAPI
- TensorFlow

---

## 🔄 The Process

### 👇 Below is the overall workflow for SpatiaLnyk
![System Architecture](assets/readme/archi.png)

We started by grounding the project in research, referencing a spatial recommendation paper that explores hierarchical and multi-granularity POI representations. This paper helped frame how recommendations could work not just at a single level, but across cities, suburbs, and individual locations
(Reference: https://arxiv.org/pdf/2101.02969).

Next, we sourced a comprehensive Singapore POI dataset from Kaggle. Rather than using it directly, we spent time understanding the structure and limitations of the data so it could be adapted to fit the system we wanted to build
(Dataset: https://www.kaggle.com/datasets/sunnysharma432/comprehensive-singapore-poi-dataset).

From there, we generated synthetic user-related datasets, including user preferences and user–POI interaction data. This allowed us to simulate realistic behavior patterns and test how recommendations might change based on different user interests and interaction histories.

Once the user data was in place, we cleaned up the POI dataset. This involved standardizing categories, removing noisy or incomplete entries, and ensuring that spatial and semantic attributes were consistent enough to support downstream modeling.


### 👇 Below is the overview of the POI tree that we constructed
![System Architecture](assets/readme/poi_tree.png)

After that, we built the POI tree hierarchy. POIs were organized into a multi-level structure, starting from broad geographic regions and progressively narrowing down to specific locations. This hierarchy made it possible to generate recommendations at different spatial granularities and enabled efficient traversal, aggregation, and embedding of POIs at each level.


### 👇 Below is how the dataset and embeddings are constructed
![System Architecture](assets/readme/embeddings.png)

With the data structures and embeddings in place, we moved on to building the natural language understanding layer. We implemented an NLP pipeline that interprets user prompts coming from the frontend. From each prompt, we extracted category-related keywords and attempted to identify any location references. If no explicit location was found, the system automatically defaulted to the user’s current location, ensuring that recommendations remained context-aware even with minimal input.

Once user intent could be reliably understood, we designed the multi-granularity recommendation framework. Instead of producing recommendations at a single level, the system computes relevance scores across multiple hierarchical levels simultaneously. These scores are composed of several components, including feature-based similarity, graph-based relationships, hierarchical boosts to respect POI structure, distance penalties to favor nearby locations, and interest-matching bonuses derived from user preferences.

After scoring, we applied filtering at every level of the hierarchy. This ensured that only the most relevant POIs progressed from broader regions down to finer-grained locations, maintaining both efficiency and recommendation quality as the search space narrowed.

To make the system more transparent and trustworthy, we then built an explainability layer. This component pulls together user profiles, POI attributes, and historical user–POI interactions to generate human-readable explanations. Recommendations are justified through factors such as attribute and category matches, distance checks, price alignment, similarity to previous visits, and an overall confidence score that reflects how well a POI fits the user’s intent.

---

## 📚 What we've Learned

Building SpatiaLynk reinforced the importance of structuring data and models around real-world hierarchies. Representing POIs across multiple spatial levels made it clear that recommendation quality improves when systems can reason at both coarse and fine granularities.

We learned that natural language understanding is critical for bridging user intent and spatial intelligence. Even simple prompts can carry implicit context, and handling missing or ambiguous location signals gracefully is key to delivering relevant results.

Designing a multi-granularity scoring framework highlighted how different signals: distance, interest alignment, hierarchical relevance, and historical interactions must be carefully balanced rather than optimized in isolation.

Finally, implementing explainability showed that transparent recommendations build trust. Being able to clearly articulate why a POI was suggested helped validate both the system’s decisions and the underlying data pipeline

---

## 💡 How can it be improved

- **Multi-user collaborative filtering**: Incorporate shared preferences and group behavior to generate recommendations that adapt to multiple users simultaneously.

- **Itinerary day planner**: Extend recommendations into time-aware itineraries that optimize routes, opening hours, and activity sequencing for full-day planning.

---


