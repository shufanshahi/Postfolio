package com.example.postfolio.roadmap.repository;

import com.example.postfolio.roadmap.entity.RoadmapItem;
import com.example.postfolio.roadmap.model.RoadmapItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RoadmapItemRepository extends JpaRepository<RoadmapItem, Long> {

    @Query("SELECT ri FROM RoadmapItem ri WHERE ri.roadmap.id = :roadmapId ORDER BY ri.dayDate")
    List<RoadmapItem> findByRoadmapIdOrderByDayDate(@Param("roadmapId") Long roadmapId);

    @Query("SELECT ri FROM RoadmapItem ri WHERE ri.roadmap.id = :roadmapId AND ri.itemType = :itemType")
    List<RoadmapItem> findByRoadmapIdAndItemType(@Param("roadmapId") Long roadmapId,
            @Param("itemType") RoadmapItemType itemType);

    @Query("SELECT ri FROM RoadmapItem ri WHERE ri.roadmap.id = :roadmapId AND ri.dayDate = :dayDate")
    List<RoadmapItem> findByRoadmapIdAndDayDate(@Param("roadmapId") Long roadmapId,
            @Param("dayDate") LocalDate dayDate);

    @Query("SELECT ri FROM RoadmapItem ri WHERE ri.roadmap.id = :roadmapId AND ri.isCompleted = :isCompleted")
    List<RoadmapItem> findByRoadmapIdAndIsCompleted(@Param("roadmapId") Long roadmapId,
            @Param("isCompleted") Boolean isCompleted);

    @Query("SELECT COUNT(ri) FROM RoadmapItem ri WHERE ri.roadmap.id = :roadmapId AND ri.isCompleted = true")
    long countCompletedItemsByRoadmapId(@Param("roadmapId") Long roadmapId);

    @Query("SELECT COUNT(ri) FROM RoadmapItem ri WHERE ri.roadmap.id = :roadmapId")
    long countTotalItemsByRoadmapId(@Param("roadmapId") Long roadmapId);
}
